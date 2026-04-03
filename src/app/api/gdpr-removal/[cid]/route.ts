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
   
    const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
    const customTokenHeader = request.headers.get("x-gdpr-token")?.trim();
    const gdprToken = process.env.GDPR_TOKEN;

    if (!gdprToken) {
      return NextResponse.json(
        { error: "GDPR token not configured" },
        { status: 500 }
      );
    }

    if (!authHeader && !customTokenHeader) {
      return NextResponse.json(
        { error: "Missing authorization" },
        { status: 401 }
      );
    }


    const expectedToken = gdprToken.trim().replace(/^['\"]|['\"]$/g, "");
    const normalizedHeader = authHeader?.trim() ?? "";
    const headerMatch = normalizedHeader.match(/^(token|bearer)\s+(.+)$/i);
    const providedToken = (customTokenHeader ?? headerMatch?.[2] ?? normalizedHeader).trim();

    if (providedToken !== expectedToken) {
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

 
    if (user) {
      await prisma.user.delete({
        where: { cid },
      });
    }

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
