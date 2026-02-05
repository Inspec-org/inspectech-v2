import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import Review from "@/lib/models/Reviews";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { Types } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId") || "";
    const departmentId = searchParams.get("departmentId") || "";
    if (!Types.ObjectId.isValid(vendorId) || !Types.ObjectId.isValid(departmentId)) {
      return new Response("Invalid params", { status: 400 });
    }

    const token = req.cookies.get("session_id")?.value || "";
    const user = await getUserFromToken(token);
    if (!user) return new Response("Unauthorized", { status: 401 });

    await connectDB();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = (obj: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        controller.enqueue(encoder.encode("retry: 10000\n\n"));
        send({ type: "connected" });

        const vObj = new Types.ObjectId(vendorId);
        const dObj = new Types.ObjectId(departmentId);

        const iStream = (Inspection as any).watch(
          [
            { $match: { operationType: { $in: ["insert", "update", "replace"] } } },
            { $match: { "fullDocument.vendorId": vObj, "fullDocument.departmentId": dObj } },
          ],
          { fullDocument: "updateLookup" }
        );
        iStream.on("change", (change: any) => {
          send({ type: "inspection", op: change.operationType });
        });

        const iDeleteStream = (Inspection as any).watch([{ $match: { operationType: "delete" } }]);
        iDeleteStream.on("change", () => {
          send({ type: "inspection", op: "delete" });
        });

        const rStream = (Review as any).watch(
          [
            { $match: { operationType: { $in: ["insert", "update", "replace"] } } },
            { $match: { "fullDocument.vendorId": vObj, "fullDocument.departmentId": dObj } },
          ],
          { fullDocument: "updateLookup" }
        );
        rStream.on("change", (change: any) => {
          send({ type: "review", op: change.operationType });
        });

        const keepAlive = setInterval(() => {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        }, 25000);

        const close = () => {
          try { iStream.close(); } catch {}
          try { iDeleteStream.close(); } catch {}
          try { rStream.close(); } catch {}
          clearInterval(keepAlive);
          try { controller.close(); } catch {}
        };

        req.signal?.addEventListener("abort", close);
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e: any) {
    return new Response(e?.message || "Internal Server Error", { status: 500 });
  }
}