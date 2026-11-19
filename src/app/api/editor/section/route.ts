import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import type { TextbookSectionData } from "@/lib/curriculum";

const execFileAsync = promisify(execFile);

function resolveSectionPath(
  year: string,
  chapterNumber: number,
  sectionId: string
): string | null {
  if (!/^[0-9_]+$/.test(sectionId)) return null;
  if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 10) {
    return null;
  }

  const baseParts =
    year === "9"
      ? ["output", "year9"]
      : year === "10"
        ? ["output", "year10"]
        : ["output"];

  const fullPath = path.join(
    process.cwd(),
    ...baseParts,
    `chapter_${chapterNumber}`,
    `${sectionId}.json`
  );
  return fullPath;
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "In-browser editor is only available in local development mode." },
      { status: 403 }
    );
  }

  try {
    const body = (await req.json()) as {
      year?: string;
      section?: TextbookSectionData;
    };

    const year = body.year || "8";
    const section = body.section;
    if (!section?.metadata) {
      return NextResponse.json(
        { error: "Missing section metadata." },
        { status: 400 }
      );
    }

    const filePath = resolveSectionPath(
      year,
      section.metadata.chapter_number,
      section.metadata.section_id
    );
    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Target section file not found: ${filePath}` },
        { status: 404 }
      );
    }

    fs.writeFileSync(filePath, JSON.stringify(section, null, 2) + "\n", "utf-8");

    const relPath = path.relative(process.cwd(), filePath);
    try {
      const { stdout, stderr } = await execFileAsync(
        "python",
        ["verify_math.py", relPath],
        { cwd: process.cwd(), timeout: 20000 }
      );
      return NextResponse.json({
        ok: true,
        savedPath: relPath,
        verificationOutput: (stdout || stderr || "Verified OK").trim(),
      });
    } catch (verifyErr: unknown) {
      const errObj = verifyErr as { stdout?: string; stderr?: string; message?: string };
      return NextResponse.json({
        ok: false,
        saved: true,
        savedPath: relPath,
        verificationOutput: (
          errObj.stderr ||
          errObj.stdout ||
          errObj.message ||
          "Verification failed"
        ).trim(),
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
