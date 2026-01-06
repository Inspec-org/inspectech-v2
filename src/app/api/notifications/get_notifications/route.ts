import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
                }),
                databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
            });
        }
        const db = admin.database();
        const snapshot = await db.ref(`${body.data.userId}/settings/notificationsEnabled`).get();
        const enabled = snapshot.val();

        if (!enabled) {
            return NextResponse.json({ data: [], message: "Notifications disabled" },{ status: 200 });
        }
        const sessionId = req.headers.get("session");
        if (!sessionId) {
            throw new Error("No session ID provided");
        }

        const backendRes = await fetch(process.env.NEXT_PUBLIC_LIVE_URL + "/admin/get_user_notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Session": sessionId
            },
            body: JSON.stringify(body),
        });

        const data = await backendRes.json();
        if (!backendRes.ok || data.status === false) {
            return NextResponse.json(
                { error: data.message, data },
                { status: backendRes.status }
            );
        }

        return NextResponse.json(
            { message: "Notifications fetched successfully", data },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error },
            { status: 500 }
        );
    }
}