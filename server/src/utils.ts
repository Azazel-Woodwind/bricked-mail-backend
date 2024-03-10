import { Expo } from "expo-server-sdk";
import expo from "./config/expo";

export const stringifyEmail = (email: Email): string =>
    `
subject: ${email.subject}
from: ${email.from}
to: ${email.to}
cc: ${email.cc}
date: ${email.date}

${email.body}

attachments: ${JSON.stringify(email.attachments)}
`;

export function getDaysDifference(dateStr: string): number {
    // Parse the given date string
    const givenDate = new Date(dateStr);

    // Get today's date at 00:00:00 for accurate day difference calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    // Calculate the difference in milliseconds
    const diffInMilliseconds = givenDate.getTime() - today.getTime();

    // Convert milliseconds to days (1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
    const diffInDays = diffInMilliseconds / (24 * 60 * 60 * 1000);

    // Return the absolute value of the difference in days
    return Math.abs(Math.round(diffInDays));
}

export async function sendPushNotification(
    pushToken: string,
    message: string,
    data: any
) {
    // Create the messages that you want to send to clients
    let messages = [];
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        return;
    }

    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    messages.push({
        to: pushToken,
        sound: "default",
        body: message,
        data,
    });

    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log(ticketChunk);
            tickets.push(...ticketChunk);
            // NOTE: If a ticket contains an error code in ticket.details.error, you
            // must handle it appropriately. The error codes are listed in the Expo
            // documentation:
            // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
        } catch (error) {
            console.error(error);
        }
    }

    return tickets;
}
