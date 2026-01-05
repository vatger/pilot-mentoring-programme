import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/gdpr-removal/[cid]
 * Delete all data for a user (VATSIM ID)
 * Authentication: Authorization header with GDPR_TOKEN
 * Returns: 200 on successful deletion or if no data existed
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    // Authenticate via Authorization header
    const authHeader = request.headers.get("Authorization");
    const gdprToken = process.env.GDPR_TOKEN;

    if (!authHeader || !gdprToken) {
      return NextResponse.json(
        { error: "Missing or invalid authorization" },
        { status: 401 }
      );
    }

    // Expect: "Token XXXXX"
    const token = authHeader.replace(/^Token\s+/, "");
    if (token !== gdprToken) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { cid } = await params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { cid },
      select: { id: true },
    });

    // Delete all related data for this CID
    // Cascade deletes will handle sessions, accounts, trainings, etc.
    if (user) {
      await prisma.user.delete({
        where: { cid },
      });
    }

    // Also delete registration record if it exists (separate model)
    await prisma.registration.deleteMany({
      where: { cid },
    });

    return NextResponse.json(
      { message: "User data deletion completed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("GDPR data deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
