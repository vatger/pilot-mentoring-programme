import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/checkrides/availability
 * Body: { startTime: string }
 * Creates a 2h availability slot for an examiner.
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Checkride slot management was removed from the workflow" },
      { status: 410 }
    );
  } catch (error) {
    console.error("Error creating availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/checkrides/availability?status=AVAILABLE&examinerId=...
 * - Examiners: see their own slots (or filter)
 * - Trainees: only see AVAILABLE future slots
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Checkride slot management was removed from the workflow" },
      { status: 410 }
    );
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/checkrides/availability
 * Body: { availabilityId: string }
 * Removes a planned checkride slot (only if still AVAILABLE, not booked)
 * Only the examining PMP_PRÜFER can delete their own slots
 */
export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Checkride slot management was removed from the workflow" },
      { status: 410 }
    );
  } catch (error) {
    console.error("Error deleting availability slot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
