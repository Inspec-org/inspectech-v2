import mongoose from "mongoose";
import { startInvitationCron } from "@/lib/cron/invitations";

const MONGODB_URI = process.env.MONGO_URI;

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
    const uri = process.env.MONGO_URI || MONGODB_URI;
    if (!uri) {
      throw new Error("Missing MONGO_URI");
    }
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;

  // ✅ Start cron ONLY ONCE
  if (!cached.cronStarted) {
    startInvitationCron();
    cached.cronStarted = true;
  }

  ;
  return cached.conn;
}
