"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";

interface User {
  id: string;
  cid: string;
  name: string;
  email: string | null;
  role: string;
  createdAt: string;
}

type UserRole = "ADMIN" | "PMP_LEITUNG" | "MENTOR" | "TRAINEE" | "PENDING_TRAINEE" | "COMPLETED_TRAINEE" | "VISITOR";

const roles: UserRole[] = ["ADMIN", "PMP_LEITUNG", "MENTOR", "TRAINEE", "PENDING_TRAINEE", "COMPLETED_TRAINEE", "VISITOR"];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");

  const userRole = (session?.user as any)?.role;
  const userCid = (session?.user as any)?.cid;
  const isAdminOrLeitung = userRole === "ADMIN" || userRole === "PMP_LEITUNG";

  useEffect(() => {
    // Redirect if not authenticated or not admin/leitung
    if (status === "loading") return;
    if (status === "unauthenticated" || !isAdminOrLeitung) {
      router.push("/");
      return;
    }

    // Fetch users
    fetchUsers();
  }, [status, isAdminOrLeitung, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUpdating(null);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    // Only ADMIN can promote to ADMIN
    if (userRole !== "ADMIN") {
      setError("Only admins can promote other admins");
      return;
    }
    await updateUserRole(userId, "ADMIN");
  };

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="text-center py-12">Loading...</div>
      </PageLayout>
    );
  }

  if (!isAdminOrLeitung) {
    return (
      <PageLayout>
        <div className="text-center py-12 text-red-600">
          Access denied. Only admins and PMP-Leitung can access this page.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">Admin Control Panel</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">CID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-mono">{user.cid}</td>
                  <td className="px-6 py-3 text-sm">{user.name}</td>
                  <td className="px-6 py-3 text-sm">{user.email || "-"}</td>
                  <td className="px-6 py-3 text-sm">
                    {userRole === "ADMIN" ? (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          updateUserRole(user.id, e.target.value as UserRole)
                        }
                        disabled={updating === user.id}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm">{user.role}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {userRole === "ADMIN" && user.role !== "ADMIN" && (
                      <button
                        onClick={() => promoteToAdmin(user.id)}
                        disabled={updating === user.id}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Make Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Your Role:</strong> {userRole}
            {userRole === "ADMIN" && (
              <span> - You can manage all users and roles.</span>
            )}
            {userRole === "PMP_LEITUNG" && (
              <span> - You can view and update roles (except promoting to ADMIN).</span>
            )}
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
