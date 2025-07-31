import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const sessionId = req.headers.get("session");
    if (!sessionId) {
        throw new Error("No session ID provided");
    }
    try {
        const backendRes = await fetch(process.env.NEXT_PUBLIC_LIVE_URL + "/admin/get_links_of_user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Session": sessionId
            },
            body: JSON.stringify(body),
        });

        const data = await backendRes.json();
        if (!backendRes.ok) {
            return NextResponse.json(
                { error: data.message },
                { status: backendRes.status }
            );
        }


        return NextResponse.json(
            { message: "Links fetched successfully", data },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}