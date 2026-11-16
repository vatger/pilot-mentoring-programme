import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Direkte Mentor-Einladungen wurden eingestellt. Bitte die Zuordnung über Admin oder PMP-Tracking vornehmen." },
    { status: 410 }
  );
}
