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

    const trainees = await prisma.user.findMany({
      where: { role: "PENDING_TRAINEE" },
      select: { id: true, cid: true, name: true },
      orderBy: { createdAt: "asc" },
    });

    const cids = trainees
      .map((trainee) => trainee.cid)
      .filter((cid): cid is string => Boolean(cid));

    const registrations = cids.length
      ? await prisma.registration.findMany({
          where: { cid: { in: cids } },
          select: { cid: true, createdAt: true },
        })
      : [];

    const registrationByCid = new Map(
      registrations.map((registration) => [registration.cid, registration.createdAt])
    );

    const rows = trainees
      .map((trainee) => ({
        ...trainee,
        registrationDate: registrationByCid.get(trainee.cid || "") || null,
      }))
      .sort((a, b) => {
        if (!a.registrationDate && !b.registrationDate) return 0;
        if (!a.registrationDate) return 1;
        if (!b.registrationDate) return -1;
        return a.registrationDate.getTime() - b.registrationDate.getTime();
      });

    const lines = rows.length
      ? rows.map((trainee, index) => {
          const name = trainee.name || "Unbekannter Trainee";
          const cid = trainee.cid || "—";
          const registeredAt = formatDateTime(trainee.registrationDate);
          return `${index + 1}. ${name} (${cid}) – Registrierung: ${registeredAt}`;
        })
      : ["Keine PENDING_TRAINEEs vorhanden."];

    const headerLines = [
      "PENDING_TRAINEEs – Registrierungsdatum",
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
    const body = new Uint8Array(buffer);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating pending trainees image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
