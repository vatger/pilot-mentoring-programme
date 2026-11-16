import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Direkte Mentor-Einladungen wurden eingestellt. Bitte wende dich für die Zuordnung an das PMP-Team." },
    { status: 410 }
  );
}
