import fs from "fs/promises";
import path from "path";
import process from "process";
import imaps from "imap-simple";
import { EventEmitter } from "events";

import { authenticate } from "@google-cloud/local-auth";
import { google, Auth } from "googleapis";

export default async function fetchUserInformation(
    auth: Auth.OAuth2Client
): Promise<UserInformation> {
    const gmail = google.gmail({ version: "v1", auth: auth });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const userEmail = profile.data.emailAddress;

    return {
        email: userEmail!,
    };
}
