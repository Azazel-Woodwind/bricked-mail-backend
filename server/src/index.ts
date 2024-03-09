import connectDB from "./config/db";
import server from "./server";

connectDB();

console.log("Starting server");

const port = process.env.PORT || 8000;

await server.listen(port, "0.0.0.0", () => {});
console.log(`Listening on port ${port}`);
