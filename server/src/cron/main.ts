import redisClient from "../config/redis";
import RedisService from "../service/redis.service";
import { getDaysDifference } from "../utils";
import fs from "fs";

// 0 9 * * * /home/admin/Development/hacklondon/server/src/cron/main.ts
async function main() {
    const today = new Date();

    for (const [
        _,
        { lastEmailShown, emails },
    ] of RedisService.USERS_ON_EMAILS) {
        let curr = emails.head;
        while (
            curr &&
            getDaysDifference((await redisClient.hGet(curr.value, "date"))!) > 7
        ) {
            await redisClient.del(curr.value);
            curr = curr.next;
            emails.deleteFront();
        }

        while (curr) {
            const deadline = await redisClient.hGet(curr.value, "deadline");
            if (deadline) {
                const days = getDaysDifference(deadline);
                // if (days <= 3) {
                //     const pushToken = fs.
                // }
                const currentImportance = parseInt(
                    (await redisClient.hGet(curr.value, "importance"))!
                );
                await redisClient.hSet(
                    curr.value,
                    "importance",
                    Math.max(currentImportance, 10 - days)
                );
            }
        }
    }
}

main();

// console.log(getDaysDifference("Sat, 8 Mar 2024 18:09:10 +0000"));

// Sat, 9 Mar 2024 18:09:10 +0000
