import { createClient } from "redis";

const redisClient = createClient({
    url: "redis://localhost:6379",
});

redisClient.on("error", err => console.log("Redis Client Error", err));

redisClient.connect();

export default redisClient;

// const userId = 'user:100';
// await client.hSet(userId, {
//     name: 'John Doe',
//     email: 'john.doe@example.com',
//     age: '30'
// });

// // Retrieve the stored object
// const user = await client.hGetAll(userId);
