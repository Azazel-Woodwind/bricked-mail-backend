import fs from "fs/promises";
import path from "path";
import process from "process";
import imaps from "imap-simple";
import { EventEmitter } from "events";

import { authenticate } from "@google-cloud/local-auth";
import { google, Auth } from "googleapis";

const SCOPES: string[] = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_PATH: string = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH: string = path.join(process.cwd(), "credentials.json");

export async function authorize(
    tokenObject: TokenObject
): Promise<Auth.OAuth2Client> {
    return google.auth.fromJSON(tokenObject) as Auth.OAuth2Client;
}

export class EmailListener extends EventEmitter {
    private auth: Auth.OAuth2Client;
    private interval: NodeJS.Timer | null = null;
    private pollingIntervalMs: number;
    private lastCheckTime: Date;

    constructor(auth: Auth.OAuth2Client, pollingIntervalMs: number = 30000) {
        super();
        this.auth = auth;
        this.pollingIntervalMs = pollingIntervalMs;
        this.lastCheckTime = new Date(Date.now() - this.pollingIntervalMs);
    }

    async start() {
        this.interval = setInterval(async () => {
            try {
                const emails = await fetchEmails(this.auth, this.lastCheckTime);

                if (emails && emails.length > 0) {
                    this.emit("emails", emails); // Emit an event with the emails
                }

                // Update lastCheckTime to the current time after fetching emails
                this.lastCheckTime = new Date();
            } catch (error) {
                console.error("Error fetching emails:", error);
            }
        }, this.pollingIntervalMs);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log("Stopped listening for emails.");
        }
    }
}

export function parseEmail(emailDetails: any): Email {
    const headers = emailDetails.data.payload?.headers || [];
    const subject = headers.find(header => header.name === "Subject")?.value;
    const from = headers.find(header => header.name === "From")?.value;
    const to = headers.find(header => header.name === "To")?.value;
    const cc = headers.find(header => header.name === "Cc")?.value;
    const date = headers.find(header => header.name === "Date")?.value;

    const attachments =
        emailDetails.data.payload?.parts
            ?.filter(part => part.filename && part.body?.attachmentId)
            .map(part => ({
                filename: part.filename,
                size: part.body.size,
            })) || [];

    let body = "";
    emailDetails.data.payload?.parts?.forEach(part => {
        if (part.mimeType === "text/plain" && part.body?.data) {
            body += Buffer.from(part.body.data, "base64").toString();
        }
    });

    const email: Email = {
        id: emailDetails.data.id,
        subject,
        from,
        to,
        cc,
        date,
        snippet: emailDetails.data.snippet,
        categories: emailDetails.data.labelIds.join(", "),
        attachments,
        body,
    };

    return email;
}

export async function fetchEmails(
    auth: Auth.OAuth2Client,
    date: Date
): Promise<Email[] | undefined> {
    const gmail = google.gmail({ version: "v1", auth });
    const query = `after:${Math.floor(date.getTime() / 1000)}`;

    const res = await gmail.users.messages.list({
        userId: "me",
        q: query,
    });

    const messages = res.data.messages;
    if (!messages || messages.length === 0) {
        return;
    }

    return Promise.all(
        messages.map(async (message): Promise<Email> => {
            const emailDetails = await gmail.users.messages.get({
                userId: "me",
                id: message.id,
                format: "full",
            });
            return parseEmail(emailDetails);
        })
    );
}

export async function fetchRecentEmails(
    auth: Auth.OAuth2Client,
    days: number = 1
): Promise<Email[] | undefined> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - days);
    const res = await fetchEmails(auth, oneDayAgo);
    return res?.slice(0, 5);
}
