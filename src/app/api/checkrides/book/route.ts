import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/checkrides/book
 * Body: { trainingId, availabilityId }
 * Mentor (or admin/leitung/pruefer) books an available slot for the trainee after mentor marks readyForCheckride.
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Checkride booking was removed from the workflow" },
      { status: 410 }
    );
  } catch (error) {
    console.error("Error booking checkride:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
