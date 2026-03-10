import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const sessionId = req.headers.get("session");
    if (!sessionId) {
        return NextResponse.json({ error: "No session ID provided" }, { status: 400 });
    }

    try {
        // Parse the JSON body from the frontend
        const body = await req.json();

        const { ...restData } = body.data || body; // Extract image if provided

        // Create FormData
        const formData = new FormData();
        formData.append("api_key", body.api_key);
        formData.append("data", JSON.stringify(restData));
        const image = restData.profileImage
        if (image) {
            if (typeof image === "string" && image.startsWith("data:")) {
                // Convert base64 -> Blob
                const base64Data = image.split(",")[1];
                const buffer = Buffer.from(base64Data, "base64");
                const blob = new Blob([buffer], { type: "image/jpeg" });
                formData.append("image", blob, "profile.jpg");
            } else {
                // If already a File object in the request
                formData.append("image", image);
            }
        }
        // Forward the FormData to your actual backend
        const backendRes = await fetch(
            process.env.NEXT_PUBLIC_LIVE_URL + "/admin/update_admin_details",
            {
                method: "POST",
                headers: {
                    Session: sessionId,
                },
                body: formData,
            }
        );

        const data = await backendRes.json();

        if (!backendRes.ok || data.status === false) {
            return NextResponse.json({ error: data.message }, { status: 400 });
        }

        return NextResponse.json({ message: "Profile updated successfully", data }, { status: 200 });
    } catch (error) {
        ;
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
