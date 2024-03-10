import { Socket } from "socket.io";
import redisClient from "../config/redis";
import { v4 as uuidv4 } from "uuid";
import fetchUserInformation from "../api/user-information";
import LinkedList, { ListNode } from "../lib/LinkedList";

// user id -> {
//     emails -> {
//         id,
//         email
//     }
//     last_updated_time: string
// }

export default class RedisService {
    public static async hasCache(email: string) {
        return redisClient.exists(`user_emails:${email}`);
    }

    // public static resetUserSession(email: string) {
    //     const temp = this.USERS_ON_EMAILS.get(email);
    //     if (temp) {
    //         temp.lastEmailShown = null;
    //     } else {
    //         this.USERS_ON_EMAILS.set(email, {
    //             lastEmailShown: null,
    //             emails: new LinkedList(),
    //         });
    //     }
    // }

    public static async getRecentEmailRange(
        email: string,
        start: number,
        end: number
    ) {
        const res = [];
        const size = await redisClient.lLen(`user_emails:${email}`);
        const emailIds = await redisClient.lRange(
            `user_emails:${email}`,
            Math.max(0, size - end),
            size - start
        );
        for (let id of emailIds) {
            res.push(redisClient.hGetAll(id));
        }

        return Promise.all(res);
    }

    public static async createEmailEntry(email: string, data: any) {
        // clean object
        Object.keys(data).forEach(key => {
            if (data[key] === undefined) {
                delete data[key];
            }
        });

        const id = `email:${uuidv4()}`;
        await redisClient.hSet(id, data);
        await redisClient.rPush(`user_emails:${email}`, id);
        return id;
    }

    public static async fetchEmailsByUserEmail(email: string) {
        const res = [];
        const emailIds = await redisClient.lRange(
            `user_emails:${email}`,
            0,
            -1
        );
        for (let id of emailIds) {
            res.push(redisClient.hGetAll(id));
        }

        return Promise.all(res);
    }

    public static async editEmailById(id: string, data: any) {
        Object.keys(data).forEach(key => {
            if (data[key] === undefined) {
                delete data[key];
            }
        });

        redisClient.hSet(id, data);
    }

    public static async updateLastUpdated(socket: UserSocket) {
        //This should return the current value, and then set the value to now
        const res = redisClient.hGet(
            `user:${socket.user.email}`,
            "last_updated_time"
        );
        redisClient.hSet(
            `user:${socket.user.email}`,
            "last_updated_time",
            Date.now()
        );

        return res;
    }
}
