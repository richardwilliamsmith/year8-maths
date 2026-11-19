import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface EditableWorksheetData {
  section_id: string;
  section_code: string;
  title: string;
  vcaa_code: string;
  tier: string;
  estimated_minutes?: number;
  fluency_questions: {
    number: number;
    prompt: string;
    parts: { label: string; question: string; answer: string }[];
  }[];
  application_questions: {
    number: number;
    question: string;
    answer: string;
  }[];
  reasoning_questions: {
    number: number;
    question: string;
    answer: string;
  }[];
  assertions: {
    id: string;
    expression: string;
    expected: number | string | boolean;
  }[];
}

function resolveWorksheetFilePath(
  year: string,
  chapterNumber: number,
  tier: string
): string | null {
  if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 10) {
    return null;
  }
  if (!["foundation", "standard", "extension"].includes(tier)) {
    return null;
  }

  const parts = [process.cwd(), "worksheets"];
  if (year === "9") parts.push("year9");
  else if (year === "10") parts.push("year10");
  if (tier !== "standard") parts.push(tier);
  parts.push(`chapter_${chapterNumber}.json`);
  return path.join(...parts);
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "In-browser editor is only available in local development mode." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") || "8";
  const chapter = Number(searchParams.get("chapter"));
  const tier = searchParams.get("tier") || "standard";
  const sectionId = searchParams.get("section_id") || "";

  const filePath = resolveWorksheetFilePath(year, chapter, tier);
  if (!filePath || !fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: "Worksheet file not found." },
      { status: 404 }
    );
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
    chapter_number: number;
    chapter_title: string;
    worksheets: EditableWorksheetData[];
  };
  const ws = raw.worksheets.find((w) => w.section_id === sectionId);
  if (!ws) {
    return NextResponse.json(
      { error: `Worksheet ${sectionId} not found in file.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    chapter_number: raw.chapter_number,
    chapter_title: raw.chapter_title,
    worksheet: ws,
  });
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
      chapter?: number;
      tier?: string;
      rebuildPdf?: boolean;
      worksheet?: EditableWorksheetData;
    };

    const year = body.year || "8";
    const chapter = Number(body.chapter);
    const tier = body.tier || "standard";
    const worksheet = body.worksheet;

    if (!worksheet?.section_id) {
      return NextResponse.json(
        { error: "Missing worksheet data." },
        { status: 400 }
      );
    }

    const filePath = resolveWorksheetFilePath(year, chapter, tier);
    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Target worksheet file not found." },
        { status: 404 }
      );
    }

    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
      chapter_number: number;
      chapter_title: string;
      tier?: string;
      worksheets: EditableWorksheetData[];
    };

    const idx = raw.worksheets.findIndex(
      (w) => w.section_id === worksheet.section_id
    );
    if (idx === -1) {
      return NextResponse.json(
        { error: `Worksheet ${worksheet.section_id} not found in file.` },
        { status: 404 }
      );
    }

    raw.worksheets[idx] = worksheet;
    fs.writeFileSync(filePath, JSON.stringify(raw, null, 2) + "\n", "utf-8");

    const relPath = path.relative(process.cwd(), filePath);
    let verificationOutput = "";
    let verifyOk = true;

    try {
      const { stdout, stderr } = await execFileAsync(
        "python",
        ["verify_worksheets.py", relPath],
        { cwd: process.cwd(), timeout: 20000 }
      );
      verificationOutput = (stdout || stderr || "Verified OK").trim();
    } catch (verifyErr: unknown) {
      verifyOk = false;
      const errObj = verifyErr as { stdout?: string; stderr?: string; message?: string };
      verificationOutput = (
        errObj.stderr ||
        errObj.stdout ||
        errObj.message ||
        "Verification failed"
      ).trim();
    }

    let pdfOutput = "";
    if (body.rebuildPdf) {
      try {
        await execFileAsync("node", ["generate_worksheet_html.mjs"], {
          cwd: process.cwd(),
          timeout: 30000,
        });
        const pattern = `worksheet_${worksheet.section_id}_${tier}.html`;
        const { stdout } = await execFileAsync(
          "python",
          ["render_pdfs.py", pattern],
          { cwd: process.cwd(), timeout: 30000 }
        );
        pdfOutput = stdout.trim();
      } catch (pdfErr: unknown) {
        const errObj = pdfErr as { stderr?: string; message?: string };
        pdfOutput = `PDF render warning: ${errObj.stderr || errObj.message || "failed"}`;
      }
    }

    return NextResponse.json({
      ok: verifyOk,
      saved: true,
      savedPath: relPath,
      verificationOutput,
      pdfOutput,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
