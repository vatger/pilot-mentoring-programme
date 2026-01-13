import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Seed a test trainee and a training record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as any).role;
    if (!["ADMIN", "PMP_LEITUNG"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const TEST_CID = "9999000";
    const trainee = await prisma.user.upsert({
      where: { cid: TEST_CID },
      create: {
        cid: TEST_CID,
        name: "Test Trainee",
        role: "TRAINEE",
      },
      update: {
        role: "TRAINEE",
      },
    });

    // Ensure a training exists
    let training = await prisma.training.findFirst({ where: { traineeId: trainee.id } });
    if (!training) {
      training = await prisma.training.create({
        data: {
          traineeId: trainee.id,
          status: "ACTIVE",
          readyForCheckride: false,
        },
      });
    }

    return NextResponse.json({ trainee, training }, { status: 200 });
  } catch (error) {
    console.error("Error seeding trainee:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
