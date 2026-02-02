import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/users - List all users
 * Only ADMIN and PMP_LEITUNG can access
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    
    if (userRole !== "ADMIN" && userRole !== "PMP_LEITUNG") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        cid: true,
        name: true,
        role: true,
        userStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users - Update user role
 * Only ADMIN can promote to ADMIN
 * ADMIN and PMP_LEITUNG can change other roles
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    
    if (userRole !== "ADMIN" && userRole !== "PMP_LEITUNG") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, newRole, newUserStatus } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Only ADMIN can set ADMIN role
    if (newRole === "ADMIN" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can promote other admins" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    
    // Handle userStatus changes
    if (newUserStatus !== undefined) {
      updateData.userStatus = newUserStatus || null;
      
      // If setting special status, change role to VISITOR
      const specialStatuses = ["Pausierter Mentor", "Deleted Mentor", "Cancelled Trainee", "Completed Trainee"];
      if (specialStatuses.includes(newUserStatus)) {
        updateData.role = "VISITOR";
      }
    }
    
    // Handle role changes
    if (newRole !== undefined) {
      updateData.role = newRole;
      
      // If assigning a new active role, clear userStatus
      if (newRole !== "VISITOR" && newUserStatus === undefined) {
        updateData.userStatus = null;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        cid: true,
        name: true,
        role: true,
        userStatus: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
