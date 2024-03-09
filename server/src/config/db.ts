import mongoose from "mongoose";

export default async function connectDB() {
    try {
        const mongodbUri = Bun.env.MONGODB_URI || "";
        await mongoose.connect(mongodbUri);
        console.log("Connected to MongoDB Atlas successfully");
    } catch (error) {
        console.error("Error connecting to MongoDB Atlas", error);
    }
}
