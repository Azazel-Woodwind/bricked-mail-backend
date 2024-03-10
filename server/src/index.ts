import connectDB from "./config/db";
import server from "./server";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

import { fetchRecentEmails, authorize, EmailListener } from "./api/email.ts";

const token = JSON.parse(
    fs.readFileSync("./token.json", "utf-8")
) as TokenObject;

const auth = await authorize(token);

console.log("Starting server");

const port = process.env.PORT || 8000;

await server.listen(port, "0.0.0.0", () => {});
console.log(`Listening on port ${port}`);
