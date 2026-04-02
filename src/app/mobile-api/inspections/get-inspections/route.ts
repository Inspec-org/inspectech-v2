import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import Vendor from "@/lib/models/Vendor";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user)
      return NextResponse.json({
        status: 401,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 401 });

    const body = await req.json();

    const page = parseInt(body.page ?? 1, 10);
    const limit = parseInt(body.limit ?? 10, 10);
    const idsOnly: boolean = Boolean(body.idsOnly);
    const department = body.department ?? undefined;
    const vendorId = body.vendorId ?? undefined;

    const filter = body.filter ?? {};

    const unitId = filter.unitId ?? undefined;
    const unitIds: string[] | undefined = Array.isArray(filter.unitIds) ? filter.unitIds : undefined;
    const inspectionStatus = filter.inspectionStatus ?? undefined;
    const inspectionStatuses: string[] | undefined = Array.isArray(filter.inspectionStatuses) ? filter.inspectionStatuses : undefined;
    const type = filter.type ?? undefined;
    const types: string[] | undefined = Array.isArray(filter.types) ? filter.types : undefined;
    const inspector = filter.inspector ?? undefined;
    const inspectors: string[] | undefined = Array.isArray(filter.inspectors) ? filter.inspectors : undefined;
    const vendor = filter.vendor ?? undefined;
    const vendors: string[] | undefined = Array.isArray(filter.vendors) ? filter.vendors : undefined;
    const location = filter.location ?? undefined;
    const locations: string[] | undefined = Array.isArray(filter.locations) ? filter.locations : undefined;
    const delivered = filter.delivered ?? undefined;
    const deliveredStatuses: string[] | undefined = Array.isArray(filter.deliveredStatuses) ? filter.deliveredStatuses : undefined;
    const search = filter.search ?? undefined;
    const duration = filter.duration ?? undefined;
    const dateMonthRange: string[] | undefined = Array.isArray(filter.dateMonthRange) ? filter.dateMonthRange : undefined;
    const dateRange: string[] | undefined = Array.isArray(filter.dateRange) ? filter.dateRange : undefined;

    await connectDB();

    const query: any = {};

    if (unitIds && unitIds.length) query.unitId = { $in: unitIds };
    else if (unitId) query.unitId = unitId;

    if (inspectionStatuses && inspectionStatuses.length) query.inspectionStatus = { $in: inspectionStatuses };
    else if (inspectionStatus) query.inspectionStatus = inspectionStatus;

    if (types && types.length) query.type = { $in: types };
    else if (type) query.type = type;

    if (inspectors && inspectors.length) query.inspector = { $in: inspectors };
    else if (inspector) query.inspector = inspector;

    if (vendors && vendors.length) {
      const vdocs = await Vendor.find({ name: { $in: vendors } }).select('_id').lean();
      const ids = vdocs.map((v: any) => v._id);
      if (ids.length) query.vendorId = { $in: ids };
    } else if (vendor) {
      const vdoc = await Vendor.findOne({ name: vendor }).select('_id');
      if (vdoc?._id) query.vendorId = vdoc._id;
    }

    if (locations && locations.length) query.location = { $in: locations };
    else if (location) query.location = location;

    if (deliveredStatuses && deliveredStatuses.length) query.delivered = { $in: deliveredStatuses };
    else if (delivered) query.delivered = delivered;

    if (Array.isArray(duration) && duration.length) {
      const conds = duration.map((d: string) => {
        const m = /^([0-9]+)m\s*([0-9]+)s$/.exec(d);
        return m ? { durationMin: m[1], durationSec: m[2] } : null;
      }).filter(Boolean) as any[];
      if (conds.length) {
        if (query.$or) {
          const prevOr = query.$or;
          delete query.$or;
          query.$and = [{ $or: prevOr }, { $or: conds }];
        } else {
          query.$or = conds;
        }
      }
    } else if (typeof duration === 'string') {
      const m = /^([0-9]+)m\s*([0-9]+)s$/.exec(duration);
      if (m) {
        query.durationMin = m[1];
        query.durationSec = m[2];
      }
    }

    if (dateRange && dateRange.length >= 2) {
      const [startStr, endStr] = dateRange;
      const start = new Date(startStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endStr);
      end.setHours(23, 59, 59, 999);
      const dateExpr: any = {
        $dateFromParts: {
          year: { $toInt: "$dateYear" },
          month: { $toInt: "$dateMonth" },
          day: { $toInt: "$dateDay" }
        }
      };
      const expr = { $and: [{ $gte: [dateExpr, start] }, { $lte: [dateExpr, end] }] };
      if (query.$or) {
        const prevOr = query.$or;
        delete query.$or;
        query.$and = [{ $or: prevOr }, { $expr: expr }];
      } else if (query.$and) {
        query.$and.push({ $expr: expr });
      } else {
        query.$expr = expr;
      }
    } else if (dateMonthRange && dateMonthRange.length >= 2) {
      const [start, end] = dateMonthRange;
      const [sY, sM] = start.split('-').map((v) => parseInt(v, 10));
      const [eY, eM] = end.split('-').map((v) => parseInt(v, 10));
      const variants = (m: number) => [m, String(m), String(m).padStart(2, '0')];
      if (sY === eY) {
        const months = Array.from({ length: eM - sM + 1 }, (_, i) => sM + i).flatMap(variants);
        if (query.$or) {
          const prevOr = query.$or;
          delete query.$or;
          query.$and = [{ $or: prevOr }, { dateYear: sY }, { dateMonth: { $in: months } }];
        } else if (query.$and) {
          query.$and.push({ dateYear: sY }, { dateMonth: { $in: months } });
        } else {
          query.dateYear = sY;
          query.dateMonth = { $in: months };
        }
      } else {
        const monthsFromStart = Array.from({ length: 12 - sM + 1 }, (_, i) => sM + i).flatMap(variants);
        const monthsToEnd = Array.from({ length: eM }, (_, i) => i + 1).flatMap(variants);
        const startOr = [{ dateYear: { $gt: sY } }, { dateYear: sY, dateMonth: { $in: monthsFromStart } }];
        const endOr = [{ dateYear: { $lt: eY } }, { dateYear: eY, dateMonth: { $in: monthsToEnd } }];
        if (query.$or) {
          const prevOr = query.$or;
          delete query.$or;
          query.$and = [{ $or: prevOr }, { $or: startOr }, { $or: endOr }];
        } else if (query.$and) {
          query.$and.push({ $or: startOr }, { $or: endOr });
        } else {
          query.$and = [{ $or: startOr }, { $or: endOr }];
        }
      }
    }

    if (search) {
      query.$or = [
        { unitId: new RegExp(search, "i") },
        { inspector: new RegExp(search, "i") },
        { vendor: new RegExp(search, "i") },
        { location: new RegExp(search, "i") },
        { type: new RegExp(search, "i") },
      ];
    }

    if (department) query.departmentId = department;
    if (vendorId) query.vendorId = vendorId;

    const total = await Inspection.countDocuments(query);

    if (idsOnly) {
      const all = await Inspection.find(query).select('unitId').lean();
      const allUnitIds = all.map((d: any) => d.unitId);
      return NextResponse.json({
        status: 200,
        success: true,
        message: "Unit IDs fetched successfully",
        data: {
          allUnitIds,
          total
        }
      }, { status: 200 });
    }

    const result = await Inspection.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('unitId inspectionStatus type inspector location delivered durationMin durationSec dateMonth dateDay dateYear vendorId createdAt')
      .populate({ path: 'vendorId', select: 'name' })
      .lean();

    const inspections = result.map(item => ({
      ...item,
      vendorId: item.vendorId._id, // just the ObjectId
      vendor: item.vendorId?.name || null // keep vendor name
    }));
    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      status: 200,
      success: true,
      message: "Inspections fetched successfully",
      data: {
        inspections,
        total,
        page,
        limit,
        totalPages
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error in POST /inspections:", error);
    return NextResponse.json({
      status: 500,
      success: false,
      message: error?.message || "Internal Server Error",
      data: null
    }, { status: 500 });
  }
}