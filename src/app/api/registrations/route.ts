import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated via SSO
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in first" },
        { status: 401 }
      );
    }

    const user = session.user as any;
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "simulator",
      "aircraft",
      "client",
      "clientSetup",
      "experience",
      "charts",
      "airac",
      "category",
      "schedule",
      "communication",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if user already has a registration
    const existingRegistration = await prisma.registration.findUnique({
      where: { cid: user.cid },
    });

    if (existingRegistration && existingRegistration.status !== "completed") {
      return NextResponse.json(
        { error: "You already have an active registration" },
        { status: 409 }
      );
    }

    // Create or update registration
    const registration = await prisma.registration.upsert({
      where: { cid: user.cid },
      update: {
        simulator: body.simulator,
        aircraft: body.aircraft,
        client: body.client,
        clientSetup: body.clientSetup,
        experience: body.experience,
        charts: body.charts,
        airac: body.airac,
        category: body.category,
        topics: body.topics || null,
        schedule: body.schedule,
        communication: body.communication,
        personal: body.personal || null,
        other: body.other || null,
        updatedAt: new Date(),
      },
      create: {
        cid: user.cid,
        name: user.name || "Unknown",
        rating: user.rating || "UNKNOWN",
        fir: user.fir || "",
        simulator: body.simulator,
        aircraft: body.aircraft,
        client: body.client,
        clientSetup: body.clientSetup,
        experience: body.experience,
        charts: body.charts,
        airac: body.airac,
        category: body.category,
        topics: body.topics || null,
        schedule: body.schedule,
        communication: body.communication,
        personal: body.personal || null,
        other: body.other || null,
        status: "pending",
      },
    });

    // Update user role from VISITOR to PENDING_TRAINEE when form is submitted
    if (user.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "PENDING_TRAINEE" },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Registration submitted successfully",
        registration,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to submit registration" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = session.user as any;

    // Fetch user's registration
    const registration = await prisma.registration.findUnique({
      where: { cid: user.cid },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "No registration found" },
        { status: 404 }
      );
    }

    return NextResponse.json(registration, { status: 200 });
  } catch (error) {
    console.error("Fetch registration error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration" },
      { status: 500 }
    );
  }
}
