import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createCanvas } from "canvas";
import { prisma } from "@/lib/prisma";

const WIDTH = 1200;
const PADDING_X = 40;
const PADDING_Y = 40;
const LINE_HEIGHT = 28;

const formatDateTime = (date: Date | string | null | undefined) => {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("de-DE");
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['PMP_LEITUNG', 'ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const relations = await prisma.trainingMentor.findMany({
      orderBy: { assignedAt: "asc" },
      include: {
        mentor: { select: { name: true, cid: true } },
        training: { select: { trainee: { select: { name: true, cid: true } } } },
      },
    });

    const lines = relations.length
      ? relations.map((relation, index) => {
          const mentorName = relation.mentor?.name || "Unbekannter Mentor";
          const mentorCid = relation.mentor?.cid || "—";
          const traineeName = relation.training?.trainee?.name || "Unbekannter Trainee";
          const traineeCid = relation.training?.trainee?.cid || "—";
          const assignedAt = relation.assignedAt
            ? new Date(relation.assignedAt).toLocaleDateString("de-DE")
            : "—";
          return `${index + 1}. ${assignedAt} – ${mentorName} (${mentorCid}) → ${traineeName} (${traineeCid})`;
        })
      : ["Keine Zuordnungen vorhanden."];

    const headerLines = [
      "Mentor–Trainee Beziehungen (nach Zuweisungszeit)",
      `Stand: ${formatDateTime(new Date())}`,
      "",
    ];

    const totalLines = headerLines.length + lines.length;
    const height = Math.max(220, PADDING_Y * 2 + totalLines * LINE_HEIGHT);

    const canvas = createCanvas(WIDTH, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WIDTH, height);

    ctx.fillStyle = "#111827";
    ctx.textBaseline = "top";

    ctx.font = "bold 28px sans-serif";
    ctx.fillText(headerLines[0], PADDING_X, PADDING_Y);

    ctx.font = "16px sans-serif";
    ctx.fillText(headerLines[1], PADDING_X, PADDING_Y + LINE_HEIGHT);

    let y = PADDING_Y + LINE_HEIGHT * 3;
    ctx.font = "18px sans-serif";
    lines.forEach((line) => {
      ctx.fillText(line, PADDING_X, y);
      y += LINE_HEIGHT;
    });

    const buffer = canvas.toBuffer("image/png");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating mentor relations image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
