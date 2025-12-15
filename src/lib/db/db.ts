import mongoose from "mongoose";
import { startInvitationCron } from "@/lib/cron/invitations";

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
    throw new Error("Missing MONGO_URI");
}

export async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        console.log("Already connected");
        // Already connected
        return;
    }

    if (mongoose.connection.readyState === 2) {
        console.log("Connecting");
        // Connecting
        return;
    }

    // Not connected → connect now
    await mongoose.connect(MONGODB_URI || "");
    console.log("MongoDB Connected");
    startInvitationCron();
}
