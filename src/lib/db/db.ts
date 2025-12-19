import mongoose from "mongoose";
import { startInvitationCron } from "@/lib/cron/invitations";

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGO_URI");
}

// 👇 Global cache (VERY IMPORTANT)
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = {
    conn: null,
    promise: null,
    cronStarted: false,
  };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI || "", {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;

  // ✅ Start cron ONLY ONCE
  if (!cached.cronStarted) {
    startInvitationCron();
    cached.cronStarted = true;
  }

  console.log("MongoDB Connected");
  return cached.conn;
}
