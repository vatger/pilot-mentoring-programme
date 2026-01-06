import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const trainingId = searchParams.get("trainingId");

    if (!trainingId) {
      return NextResponse.json(
        { error: "trainingId is required" },
        { status: 400 }
      );
    }

    const checkride = await prisma.checkride.findFirst({
      where: { trainingId },
      include: {
        examiner: {
          select: {
            id: true,
            name: true,
            cid: true,
          },
        },
        assessment: {
          select: {
            id: true,
            overallResult: true,
          },
        },
      },
    });

    if (!checkride) {
      return NextResponse.json({ error: "Checkride not found" }, { status: 404 });
    }

    return NextResponse.json(checkride);
  } catch (error: any) {
    console.error("Error fetching checkride:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
