import { NextRequest, NextResponse } from "next/server";
import Department from "@/lib/models/Departments";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let departments = [];

    if (user.role === "admin") {
      departments = await Department.find();
    } else if (user.role === "vendor") {
      departments = await Department.find({
        name: { $regex: "trailers", $options: "i" }
      });
    }

    // Add color field based on department name
    const departmentsWithColor = departments.map(dept => {
      let color = "";
      const nameLower = dept.name.toLowerCase();

      if (nameLower.includes("us")) color = "purple";
      else if (nameLower.includes("canada")) color = "blue";
      else if (nameLower.includes("maintenance")) color = "red";
      else if (nameLower.includes("campaign")) color = "green";

      return { ...dept.toObject(), color };
    });

    return NextResponse.json({ message: "success", departments: departmentsWithColor });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
