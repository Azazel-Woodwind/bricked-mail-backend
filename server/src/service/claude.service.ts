import redisClient from "../config/redis";
import { v4 as uuidv4 } from "uuid";
import Anthropic from "@anthropic-ai/sdk";
import {
    BRIEF_SUMMARY_SYS_PROMPT,
    CATEGORY_SYS_PROMPT,
    DEADLINE_SYS_PROMPT,
    IMPORTANCE_SYS_PROMPT,
    LONG_SUMMARY_SYS_PROMPT,
    MAILBOX_SUMMARY_SYS_PROMPT,
} from "../prompts/prompts";
import { EventEmitter } from "stream";

// const res = await new Promise<string>((resolve, reject) => {
//     let separatorCount = 0;
//     let data = "";
//     const stream = client.messages
//         .stream({
//             system: systemPrompt,
//             messages: [
//                 {
//                     role: "user",
//                     content: content,
//                 },
//             ],
//             model: "claude-3-opus-20240229",
//             max_tokens: 1024,
//         })
//         .on("text", text => {
//             if (text.trim() === `"""`) {
//                 separatorCount++;
//                 return;
//             }
//             if (separatorCount === 1) {
//                 data += text;
//             } else if (separatorCount === 2) {
//                 stream.destroy(); // Abort the request
//                 resolve(data);
//             }
//         })
//         .on("error", error => {
//             reject(error);
//         })
//         .on("end", () => {});
// });

export default class ClaudeService {
    private static async evaluateStreamWithSeparator(
        systemPrompt: string,
        content: string
    ): Promise<string> {
        const client = new Anthropic({
            apiKey: process.env["ANTHROPIC_KEY"],
        });

        try {
            const res = await new Promise<string>((resolve, reject) => {
                let separatorCount = 0;
                let data = "";
                let finalMessage = "";
                const stream = client.messages
                    .stream({
                        system: systemPrompt,
                        messages: [
                            {
                                role: "user",
                                content: content,
                            },
                        ],
                        model: "claude-3-opus-20240229",
                        max_tokens: 1024,
                    })
                    .on("text", text => {
                        finalMessage += text;
                        if (text.trim() === `"""`) {
                            separatorCount++;
                            if (separatorCount === 2) {
                                resolve(data.trim());
                                stream.abort();
                            }
                            return;
                        }

                        if (separatorCount === 1) {
                            data += text;
                        }
                    })
                    .on("error", error => {
                        reject(error);
                    })
                    .on("end", () => {
                        console.log("STREAM ENDED");
                        // console.log("FINAL MESSAGE:", finalMessage);
                    })
                    .on("abort", () => {
                        console.log("STREAM ABORTED");
                    })
                    .on("finalMessage", message => {
                        console.log("FINAL MESSAGE:", message.content[0].text);
                    });
            });

            return res as string;
        } catch (error) {
            console.log("ERROR IN evaluateStreamWithSeparator:");
            throw error;
        }
    }

    public static async evaluateImportance(
        email: string,
        userPreferences: string | undefined
    ): Promise<number> {
        // console.log("EVALUATING IMPORTANCE...");
        while (1) {
            try {
                const res = await this.evaluateStreamWithSeparator(
                    IMPORTANCE_SYS_PROMPT(userPreferences),
                    email
                );

                console.log("RESPONSE:", res);

                return parseInt(res);
            } catch (error) {
                console.log("HIT CONCURRENCY LIMIT: evaluateImportance");
                await new Promise(resolve => setTimeout(resolve, 5000));
                console.log("RETRYING: evaluateImportance...");
            }
        }

        return 69;
    }

    public static async evaluateCategory(
        email: string,
        userCategories: string
    ): Promise<string> {
        // console.log("EVALUATING CATEGORY...");
        while (1) {
            try {
                const res = await this.evaluateStreamWithSeparator(
                    CATEGORY_SYS_PROMPT(userCategories),
                    email
                );

                console.log("RESPONSE:", res);

                return res;
            } catch (error) {
                console.log("HIT CONCURRENCY LIMIT: evaluateCategory");
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        return "Little Bitch";
    }

    public static async evaluateDeadline(email: string): Promise<string> {
        // console.log("EVALUATING DEADLINE...");
        while (1) {
            try {
                const res = await this.evaluateStreamWithSeparator(
                    DEADLINE_SYS_PROMPT,
                    email
                );

                console.log("RESPONSE:", res);

                return res;
            } catch (error) {
                console.log("HIT CONCURRENCY LIMIT: evaluateDeadline");
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        return "Little Bitch";
    }

    public static async generateBriefSummary(email: string): Promise<string> {
        // console.log("EVALUATING DEADLINE...");
        while (1) {
            try {
                const client = new Anthropic({
                    apiKey: process.env["ANTHROPIC_KEY"],
                });

                const res = await client.messages.create({
                    model: "claude-3-opus-20240229",
                    max_tokens: 1024,
                    system: BRIEF_SUMMARY_SYS_PROMPT,
                    messages: [
                        {
                            role: "user",
                            content: email,
                        },
                    ],
                });

                return res.content[0].text;
            } catch (error) {
                console.log("HIT CONCURRENCY LIMIT: generateBriefSummary");
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        return "Little Bitch";
    }

    public static async generateLongSummary({
        email,
        eventEmitter,
    }: {
        email: string;
        eventEmitter?: EventEmitter;
    }): Promise<string> {
        const client = new Anthropic({
            apiKey: process.env["ANTHROPIC_KEY"],
        });

        while (1) {
            try {
                console.log("LOOP");
                let separatorCount = 0;
                let finalStage = "";
                let record = false;
                let fullMessage = "";
                const res = await new Promise<string>((resolve, reject) => {
                    const stream = client.messages
                        .stream({
                            system: LONG_SUMMARY_SYS_PROMPT,
                            messages: [
                                {
                                    role: "user",
                                    content: email,
                                },
                            ],
                            model: "claude-3-opus-20240229",
                            max_tokens: 1024,
                        })
                        .on("text", text => {
                            fullMessage += text;
                            // console.log(text);

                            if (text.trim() === `"""`) {
                                separatorCount++;

                                if (separatorCount === 6) {
                                    // console.log("FULL MESSAGE:", fullMessage);
                                    // resolve(finalStage.trim());
                                    // stream.abort();
                                    return;
                                }
                            }

                            if (separatorCount === 5) {
                                // console.log("ENTERED FINAL STAGE");
                                finalStage += text;
                                if (record && eventEmitter) {
                                    eventEmitter.emit("token", text);
                                }
                            }

                            if (finalStage.endsWith("DENSER SUMMARY:")) {
                                finalStage = "";
                                record = true;
                            }
                        })
                        .on("error", error => {
                            reject(error);
                        })
                        .on("end", () => {
                            console.log("STREAM ENDED");
                            resolve(finalStage.trim());

                            // console.log("FINAL MESSAGE:", fullMessage);
                        })
                        .on("abort", () => {
                            console.log("STREAM ABORTED");
                        })
                        .on("finalMessage", message => {
                            // console.log("FINAL MESSAGE:", message.content[0].text);
                        });
                });

                return res;

                // return finalStage;
            } catch {
                console.log("HIT CONCURRENCY LIMIT: generateLongSummary");
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        return "";
    }

    public static async summariseMailbox(emails: any[]): Promise<string> {
        while (1) {
            try {
                const client = new Anthropic({
                    apiKey: process.env["ANTHROPIC_KEY"],
                });

                const res = await client.messages.create({
                    model: "claude-3-opus-20240229",
                    max_tokens: 512,
                    system: MAILBOX_SUMMARY_SYS_PROMPT,
                    messages: [
                        {
                            role: "user",
                            content: emails
                                .map((email, i) => {
                                    return `
                                    EMAIL ${i + 1}:
                                    FROM: ${email.from}
                                    SUBJECT: ${email.subject}
                                    ${
                                        email.longSummary
                                            ? "SUMMARY: " + email.longSummary
                                            : email.briefSummary
                                            ? `SUMMARY: ${email.briefSummary}`
                                            : ""
                                    }

                                    `;
                                })
                                .join("\n"),
                        },
                    ],
                });

                return res.content[0].text;
            } catch (error) {
                console.log("HIT CONCURRENCY LIMIT: summariseMailbox");
                // console.log("ERROR:", error);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        return "Little Bitch";
    }
}
