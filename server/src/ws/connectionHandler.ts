import { Socket } from "socket.io";
import onTestHandler from "./handlers/testHandler";
import {
    fetchEmails,
    fetchRecentEmails,
    EmailListener,
    authorize,
} from "../api/email";
import fs from "fs";
import { sendPushNotification, stringifyEmail } from "../utils";
import fetchUserInformation from "../api/user-information";
import ClaudeService from "../service/claude.service";
import { v4 } from "uuid";
import RedisService from "../service/redis.service";
import { analyseEmail } from "../api/analyse-email";
import OrderMaintainer from "../lib/OrderMaintainer";
import redisClient from "../config/redis";
import { sleep } from "@anthropic-ai/sdk/core";

/*
    ON SOCKET CONNECT:
        receive user Configuration and Token

        IF existing user_cache:
            Fetch and process new emails from lastTimeFetched and update it.
            Add emails into cache, and purge emails older than cutoff.
        ELSE:
            Fetch and process emails up until cutoff date.
    
        -- SEND ALL RELEVANT DATA TO THE USERS APPLICATION e.g GLOBAL SUMMARY, EMAILS, DEADLINES etc.

        ON EMAIL INBOUND:
            Calculate email importance, category and deadline -> 
            
            IF importance > 5:
                generate brief summary

            IF importance > 7:
                generate long summary

            IF importance > notify_threshold:
                NOTIFY USER ABOUT EMAIL WITH PUSH NOTIFICATION 
        
        ON REQUEST NEW GENERAL SUMMARY:
            Run the general summary function again, store it in cache and send to user

        ON UPDATE CONFIG:
            Update config object on existing socket
*/

/*
    CRON TIMERS --
    REVALUATE PREVIOUS IN-CACHE EMAIL IMPORTANCE FOR MESSAGES WITH DEADLINES:
        Calculate email importance and update
*/

type DataHandler = (data: any, socket: Socket) => void;

const connectionHandler = async (socket: Socket) => {
    console.log("Socket connected");
    const route = (handler: DataHandler) => (data: any) =>
        handler(data, socket);

    let pushToken: string;
    let foregrounded = true;

    const authenticateSocket = async () => {
        //Receive the user authentication, and config
        try {
            socket.token = socket.handshake.auth.token as TokenObject;
            socket.auth = await authorize(socket.token);
            socket.settings = socket.handshake.auth.token as Settings;
            socket.user = await fetchUserInformation(socket.auth);
        } catch (err) {
            console.log(err);
            socket.disconnect();
        }
    };

    const storeAndStreamEmails = async (emails: Email[]) => {
        console.log(`Processing ${emails.length} emails`);

        return Promise.all(
            emails.map(async email => {
                Object.keys(email).forEach(key => {
                    if (email[key] === undefined) {
                        delete email[key];
                    }
                });
                delete email.body;
                delete email.categories;
                delete email.snippet;
                delete email.attachments;
                // const id = await RedisService.createEmailEntry(
                //     email,
                //     socket.user.email
                // );

                const emailString = stringifyEmail(email);
                const userPreferences = await redisClient.hGet(
                    socket.user.email,
                    "preferences"
                );
                const userCategories = await redisClient.hGet(
                    socket.user.email,
                    "categories"
                );
                const [importance, category, deadline] = await Promise.all([
                    ClaudeService.evaluateImportance(
                        emailString,
                        userPreferences
                    ),

                    ClaudeService.evaluateCategory(
                        emailString,
                        userCategories ? JSON.parse(userCategories) : undefined
                    ),

                    ClaudeService.evaluateDeadline(emailString),
                ]);

                // if (foregrounded) {
                //     socket.emit("email", {
                //         ...currentInfo,
                //         importance,
                //         category,
                //         deadline,
                //         id,
                //     });
                // }

                let briefSummary, longSummary;
                if (importance >= 5) {
                    briefSummary = await ClaudeService.generateBriefSummary(
                        emailString
                    );
                }

                if (importance >= 7) {
                    longSummary = await ClaudeService.generateLongSummary({
                        email: emailString,
                    });
                }

                const info = {
                    briefSummary,
                    longSummary,
                    importance,
                    category,
                    deadline,
                    ...email,
                };

                await RedisService.createEmailEntry(socket.user.email, info);

                if (parseInt(email.importance) >= 8 && pushToken) {
                    const message = `
URGENT! You have an URGENT email from ${email.from}!
SUBJECT: ${email.subject}
SUMMARY: ${email.briefSummary}
                `;
                    sendPushNotification(pushToken, message, email);
                }

                if (foregrounded) {
                    console.log("EMITTING EMAIL:", info);
                    socket.emit("email", info);
                } else {
                    console.log("NOT FOREGROUNDED");
                }

                return {
                    ...email,
                    ...info,
                };

                // sendOrderMaintainer.addData(
                //     {
                //         ...info,
                //         id,
                //     },
                //     order
                // );
            })
        );
    };
    await authenticateSocket();
    // console.log("FIRST", RedisService.USERS_ON_EMAILS.get(socket.user.email)!);
    // RedisService.resetUserSession(socket.user.email);
    // console.log("SECOND", RedisService.USERS_ON_EMAILS.get(socket.user.email)!);

    let emails;
    if (await RedisService.hasCache(socket.user.email)) {
        console.log("FOUND EMAILS, USING CACHE");
        emails = await RedisService.getRecentEmailRange(
            socket.user.email,
            0,
            10
        );
        socket.emit("emails", emails);
    } else {
        console.log("DID NOT FIND CACHE, FETCHING EMAILS");
        redisClient.hSet(socket.user.email, "connectedBefore", "true");
        emails = await fetchRecentEmails(socket.auth, 1);
        emails = await storeAndStreamEmails(emails);
    }

    const summary = await redisClient.hGet(socket.user.email, "summary");
    // console.log("Summary", summary);
    if (summary) {
        console.log("FOUND SUMMARY");
        socket.emit("summary", { text: summary, lastUpdated: Date.now() });
    } else {
        console.log("DIDNT FIND SUMMARY");
        // console.log(RedisService.USERS_ON_EMAILS);
        // console.log(RedisService.USERS_ON_EMAILS.get(socket.user.email)!);

        console.log("GENERATING SUMMARY");
        const summary = await ClaudeService.summariseMailbox(emails);
        console.log("SUMMARY:", summary);
        socket.emit("summary", { text: summary, lastUpdated: Date.now() });
        await redisClient.hSet(socket.user.email, "summary", summary);
    }

    // const connectedBefore = await redisClient.hGet(
    //     socket.user.email,
    //     "connectedBefore"
    // );

    // let emails;
    // if (connectedBefore) {
    // } else {
    // }

    // socket.emit("summary", { text: summary, lastUpdated: Date.now() });

    const interval = setInterval(async () => {
        // cache summary
        let emails = await RedisService.getRecentEmailRange(
            socket.user.email,
            0,
            10
        );
        const summary = await ClaudeService.summariseMailbox(emails);
        await redisClient.hSet(socket.user.email, "summary", summary);
        if (!pushToken) return;

        let urgent = 0,
            important = 0,
            normal = 0,
            unimportant = 0;
        emails = RedisService.fetchEmailsByUserEmail(socket.user.email);
        for (let email of emails) {
            const importance = parseInt(email.importance);
            if (importance >= 8) {
                urgent++;
            } else if (importance >= 6) {
                important++;
            } else if (importance >= 4) {
                normal++;
            } else {
                unimportant++;
            }
        }

        const message = `You have ${urgent} urgent emails, ${important} important emails, ${normal} normal emails and ${unimportant} unimportant emails.`;
        sendPushNotification(pushToken, message, socket.user.email);
    }, 1000 * 60 * 60 * 4); // 4 hours

    const listenForEmails = async () => {
        const emailListener = new EmailListener(socket.auth);
        emailListener.start();

        emailListener.on("emails", async (emails: Email[]) => {
            /*
                Process all info
                IN ORDER:
                    IF of urgent importance, send a push notification
                    IF foregrounded, send to client
            */
            // RedisService.updateLastUpdated(socket.auth);
            console.log("Received emails", emails);
            await storeAndStreamEmails(emails);
        });

        socket.on("disconnect", () => {
            // emailListener.stop();
            foregrounded = false;
        });
    };

    socket.emit("user-information", socket.user);

    await listenForEmails();

    //Fetch email route
    let count = 1;
    socket.on("fetch-emails", async (): Promise<void> => {
        console.log("FETCHING NEXT 10 EMAILS");
        const emails = await RedisService.getRecentEmailRange(
            socket.user.email,
            count * 10,
            (count + 1) * 10
        );
        socket.emit("emails", emails);
        count++;
    });

    //Update settings route
    socket.on("update-user-categories", newCategories => {
        redisClient.hSet(socket.user.email, "categories", newCategories);
    });

    socket.on("update-user-preferences", newPreferences => {
        redisClient.hSet(socket.user.email, "preferences", newPreferences);
    });

    socket.on("request-summary", async () => {
        const visibleEmails = await RedisService.getRecentEmailRange(
            socket.user.email,
            0,
            count * 10
        );
        const important = visibleEmails.slice(0, 15);
        important.sort(
            (a, b) => parseInt(b.importance) - parseInt(a.importance)
        );
        // const recentEmails = await fetchRecentEmails(socket.auth, 7);
        // const processedEmails = await storeAndStreamEmails(recentEmails);
        // const summary = await ClaudeService.summariseMailbox(processedEmails);
        // socket.emit("summary", { text: summary, lastUpdated: Date.now() });
        // let emails = await RedisService.getNMostRecentEmails(
        //     socket.user.email,
        //     10
        // );
        // const summary = await ClaudeService.summariseMailbox(emails);
        // socket.emit("summary", { text: summary, lastUpdated: Date.now() });
        // await redisClient.hSet(socket.user.email, "summary", summary);
    });

    socket.on("resolve-deadline", async emailID => {
        await redisClient.hDel(emailID, "deadline");
        const oldImportance = parseInt(
            (await redisClient.hGet(emailID, "importance"))!
        );
        await redisClient.hSet(emailID, "importance", oldImportance / 2);

        socket.emit("email-update", {
            id: emailID,
            importance: oldImportance / 2,
        });
    });

    //Request new global summary prompt
    socket.on("notification-token", (token): void => {
        pushToken = token;
        fs.writeFileSync("./pushToken.json", JSON.stringify(token));
    });
};

export default connectionHandler;
