import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Configuration from "@/lib/models/Configurations";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        {
          status: 401,
          success: false,
          message: "Unauthorized",
          data: null,
        },
        { status: 401 }
      );
    }

    const { id } = await ctx.params;

    if (!id) {
      return NextResponse.json(
        {
          status: 400,
          success: false,
          message: "Configuration id required",
          data: null,
        },
        { status: 400 }
      );
    }

    await connectDB();

    const cfg = await Configuration.findOne({
      _id: id,
      userId: user._id,
    });

    if (!cfg) {
      return NextResponse.json(
        {
          status: 404,
          success: false,
          message: "Configuration not found",
          data: null,
        },
        { status: 404 }
      );
    }

    await Configuration.deleteOne({ _id: id });

    return NextResponse.json(
      {
        status: 200,
        success: true,
        message: "Configuration deleted successfully",
        data: null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 500,
        success: false,
        message: error?.message || "Internal Server Error",
        data: null,
      },
      { status: 500 }
    );
  }
}