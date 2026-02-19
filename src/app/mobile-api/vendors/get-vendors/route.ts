import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/getUserFromToken";
import Vendor from "@/lib/models/Vendor";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1] || "";

    if (!token) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "No token provided",
        data: null
      }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 401 });
    }

    let vendors: any[] = [];

    if (user.role === "admin") {
      if (user.vendorAccess && user.vendorAccess.length > 0) {
        const vendorIds = user.vendorAccess.map((v: any) => v.$oid || v);
        vendors = await Vendor.find({ _id: { $in: vendorIds }, status: 'active' })
          .select("_id name")
          .sort({ createdAt: -1 });
      }
    } else if (user.role === "vendor" || user.role === "user") {
      if (user.vendorId) {
        vendors = await Vendor.find({ _id: user.vendorId, status: 'active' })
          .select("_id name");
      }
    } else if (user.role === "superadmin") {
      vendors = await Vendor.find()
        .select("_id name")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({
      status: 200,
      success: true,
      message: "Vendors retrieved successfully",
      data: vendors
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      success: false,
      message: error.message || "Internal Server Error",
      data: null
    }, { status: 500 });
  }
}


// export async function POST(req: NextRequest) {
//   try {
//     const authHeader = req.headers.get("Authorization");
//     const token = authHeader?.split(" ")[1] || "";

//     if (!token) {
//       return NextResponse.json({
//         status: 401,
//         success: false,
//         message: "No token provided",
//         data: null
//       }, { status: 401 });
//     }

//     const user = await getUserFromToken(token);
//     if (!user || user.role !== "admin") {
//       return NextResponse.json({
//         status: 403,
//         success: false,
//         message: "Unauthorized",
//         data: null
//       }, { status: 403 });
//     }

//     const { name } = await req.json();

//     if (!name || !name.trim()) {
//       return NextResponse.json({
//         status: 400,
//         success: false,
//         message: "Vendor name is required",
//         data: null
//       }, { status: 400 });
//     }

//     const exists = await Vendor.findOne({ name: name.trim() });
//     if (exists) {
//       return NextResponse.json({
//         status: 409,
//         success: false,
//         message: "Vendor already exists",
//         data: null
//       }, { status: 409 });
//     }

//     const vendor = await Vendor.create({ name: name.trim() });

//     return NextResponse.json({
//       status: 201,
//       success: true,
//       message: "Vendor created successfully",
//       data: {
//         _id: vendor._id,
//         name: vendor.name
//       }
//     }, { status: 201 });

//   } catch (error: any) {
//     return NextResponse.json({
//       status: 500,
//       success: false,
//       message: error.message || "Internal Server Error",
//       data: null
//     }, { status: 500 });
//   }
// }
