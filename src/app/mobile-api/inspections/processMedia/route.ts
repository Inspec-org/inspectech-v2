import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

// cvLabel must exactly match the labels the CV API expects and returns.
const IMAGE_FIELDS = [
  { key: "frontLeftSideUrl",      label: "Front Left Side",  cvLabel: "front_left",  cvGroup: "front"  },
  { key: "frontRightSideUrl",     label: "Front Right Side", cvLabel: "front_right", cvGroup: "front"  },
  { key: "rearLeftSideUrl",       label: "Rear Left Side",   cvLabel: "rear_left",   cvGroup: "rear"   },
  { key: "rearRightSideUrl",      label: "Rear Right Side",  cvLabel: "rear_right",  cvGroup: "rear"   },
  { key: "insideTrailerImageUrl", label: "Inside Trailer",   cvLabel: "inside",      cvGroup: "inside" },
  { key: "doorDetailsImageUrl",   label: "Door Details",     cvLabel: "door",        cvGroup: "door"   },
];

/**
 * Parses a CV report group and returns pass/fail + all component details.
 * The CV API response shape per group:
 * {
 *   label: string,
 *   images_provided: string[],
 *   components: {
 *     [componentName]: { status: "pass"|"fail"|"warning", detail?: string, ... }
 *   },
 *   notes: string[]
 * }
 */
function parseGroupResult(group: any): { pass: boolean; message: string; issues: string[]; details: string[] } {
  if (!group) return { pass: true, message: "No CV data for this group", issues: [], details: [] };

  const issues: string[] = [];
  const details: string[] = [];
  const notes: string[] = Array.isArray(group.notes) ? group.notes : [];

  console.log("CV group full data:", JSON.stringify(group, null, 2));

  if (group.components && typeof group.components === "object") {
    for (const [componentName, componentData] of Object.entries<any>(group.components)) {
      const raw = typeof componentData === "object" ? componentData : { status: componentData };
      const status = (raw?.status ?? "").toString().toLowerCase();
      // Collect any descriptive text from various possible fields
      const detail =
        raw?.detail ??
        raw?.message ??
        raw?.value ??
        raw?.result ??
        raw?.description ??
        status;

      const displayLine = `${componentName}: ${detail}`;
      details.push(displayLine);

      if (status === "fail" || status === "warning" || status === "error") {
        issues.push(displayLine);
      }
    }
  }

  // Surface notes
  for (const note of notes) {
    if (typeof note === "string" && note.trim()) {
      details.push(note);
      issues.push(note);
    }
  }

  const pass = issues.length === 0;
  return {
    pass,
    message: pass ? "All checks passed" : "Issues detected",
    issues,
    details,
  };
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { status: 401, success: false, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get("unitId") || "";
    if (!unitId) {
      return NextResponse.json(
        { status: 400, success: false, message: "unitId is required", data: null },
        { status: 400 }
      );
    }

    await connectDB();

    const inspection: any = await Inspection.findOne({ unitId }).lean();
    if (!inspection) {
      return NextResponse.json(
        { status: 404, success: false, message: "Inspection not found", data: null },
        { status: 404 }
      );
    }

    const imageStatuses = IMAGE_FIELDS.map((f) => {
      const url = inspection[f.key];
      const hasUrl = url && String(url).trim().length > 0;
      return {
        label: f.label,
        cvLabel: f.cvLabel,
        cvGroup: f.cvGroup,
        url: hasUrl ? String(url).trim() : null,
        missing: !hasUrl,
      };
    });

    const missingImages = imageStatuses.filter((i) => i.missing).map((i) => i.label);
    const presentImages = imageStatuses
      .filter((i) => !i.missing)
      .map((i) => ({ label: i.cvLabel, image_url: i.url as string }));

    let cvReport: any = null;
    if (presentImages.length > 0) {
      try {
        const cvRes = await fetch("https://mlbench123-inspectech-cv.hf.space/inspect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: presentImages }),
        });
        if (cvRes.ok) {
          const cvJson = await cvRes.json();
          console.log("CV full response:", JSON.stringify(cvJson, null, 2));
          if (cvJson.status === "success") {
            cvReport = cvJson;
          }
        }
      } catch {
        // CV API failure is non-fatal
      }
    }

    const cvLabelsMissing: string[] = cvReport?.labels_missing ?? [];
    const cvReportGroups: Record<string, any> = cvReport?.report ?? {};

    const imageResults = imageStatuses.map((img) => {
      // 1. Never uploaded
      if (img.missing) {
        return {
          label: img.label,
          status: "error" as const,
          message: "No image uploaded",
          issues: ["No image uploaded"],
          details: [],
        };
      }

      // 2. Uploaded but CV couldn't process it
      if (cvLabelsMissing.includes(img.cvLabel)) {
        return {
          label: img.label,
          status: "error" as const,
          message: "Image could not be processed by CV",
          issues: ["CV could not process this image"],
          details: [],
        };
      }

      // 3. CV returned a group result
      const group = cvReportGroups[img.cvGroup];
      if (group) {
        const { pass, message, issues, details } = parseGroupResult(group);
        return {
          label: img.label,
          status: pass ? ("pass" as const) : ("fail" as const),
          message,
          issues,
          details,
        };
      }

      // 4. No group result returned
      return {
        label: img.label,
        status: "pass" as const,
        message: "Image present (CV result unavailable)",
        issues: [],
        details: [],
      };
    });

    const hasErrors = imageResults.some((r) => r.status === "error" || r.status === "fail");
    const mediaStatus: "pass" | "fail" = hasErrors ? "fail" : "pass";

    return NextResponse.json(
      {
        status: 200,
        success: true,
        message: "Media inspection processed",
        data: {
          mediaStatus,
          missingImages,
          imageResults,
          cvReport: cvReport ?? null,
        },
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