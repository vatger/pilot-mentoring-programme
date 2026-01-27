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
  userStatus: string | null;
  createdAt: string;
}

interface PendingCancellation {
  id: string;
  traineeId: string;
  trainee: { id: string; name: string; cid: string };
  cancellationReason: string;
  cancellationAt: string;
}

type UserRole = "ADMIN" | "PMP_LEITUNG" | "PMP_PRÜFER" | "MENTOR" | "TRAINEE" | "PENDING_TRAINEE" | "COMPLETED_TRAINEE" | "VISITOR";
type UserStatus = "" | "Pausierter Mentor" | "Deleted Mentor" | "Cancelled Trainee" | "Completed Trainee";

const roles: UserRole[] = ["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER", "MENTOR", "TRAINEE", "PENDING_TRAINEE", "COMPLETED_TRAINEE", "VISITOR"];
const userStatuses: UserStatus[] = ["", "Pausierter Mentor", "Deleted Mentor", "Cancelled Trainee", "Completed Trainee"];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingCancellations, setPendingCancellations] = useState<PendingCancellation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [approvingCancellation, setApprovingCancellation] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

      // Also fetch pending cancellations
      const cancellationsRes = await fetch("/api/training/pending-cancellations");
      if (cancellationsRes.ok) {
        const cancellationsData = await cancellationsRes.json();
        setPendingCancellations(cancellationsData);
      }
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

  const updateUserStatus = async (userId: string, newUserStatus: UserStatus) => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newUserStatus: newUserStatus || null }),
      });
      if (!res.ok) throw new Error("Failed to update user status");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUpdating(null);
    }
  };

  const approveCancellation = async (trainingId: string, action: "delete" | "reactivate") => {
    setApprovingCancellation(trainingId);
    try {
      const res = await fetch("/api/training/cancel/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve cancellation");
      }
      await fetchUsers();
      alert(
        action === "delete"
          ? "Trainee und alle Daten wurden gelöscht"
          : "Trainee wurde als wartender Trainee zurück aktiviert"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setApprovingCancellation(null);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    // Only ADMIN can promote to ADMIN
    if (userRole !== "ADMIN") {
      setError("Nur Admins können andere Admins befördern");
      return;
    }
    await updateUserRole(userId, "ADMIN");
  };

  // Sort and filter users
  const sortedAndFilteredUsers = users
    .filter((user) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        user.cid?.toLowerCase().includes(query) ||
        user.name?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      // 1st: Sort by role
      const roleA = roles.indexOf(a.role as UserRole);
      const roleB = roles.indexOf(b.role as UserRole);
      if (roleA !== roleB) return roleA - roleB;

      // 2nd: Sort by userStatus
      const statusA = a.userStatus || "";
      const statusB = b.userStatus || "";
      if (statusA !== statusB) return statusA.localeCompare(statusB);

      // 3rd: Sort by CID
      const cidA = a.cid || "";
      const cidB = b.cid || "";
      return cidA.localeCompare(cidB);
    });

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="text-center py-12">Lade...</div>
      </PageLayout>
    );
  }

  if (!isAdminOrLeitung) {
    return (
      <PageLayout>
        <div className="text-center py-12 text-red-600">
          Zugriff verweigert. Nur Admins und PMP-Leitung haben Zugriff.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1>Admin Control Panel</h1>
        <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
          Benutzer verwalten und Rollen zuweisen
        </p>
      </div>

      {error && (
        <div className="info-danger" style={{ marginBottom: "1.5rem" }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card">
          <p style={{ margin: 0 }}>Lade...</p>
        </div>
      ) : (
        <>
          {/* Pending Cancellations Section */}
          {pendingCancellations.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <div className="card" style={{ marginBottom: "1rem", borderLeft: "4px solid var(--accent-color)" }}>
                <h2 style={{ marginTop: 0, marginBottom: "1rem", color: "var(--text-color)" }}>
                  Wartende Trainingsabbrüche ({pendingCancellations.length})
                </h2>
                <p style={{ color: "var(--text-color)", marginBottom: "1rem" }}>
                  Die folgenden Trainings wurden von Mentoren zur Genehmigung eingereicht:
                </p>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {pendingCancellations.map((cancellation) => (
                    <div key={cancellation.id} className="card" style={{ backgroundColor: "var(--card-bg)" }}>
                      <div style={{ marginBottom: "1rem" }}>
                        <h3 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.1em" }}>
                          {cancellation.trainee.name}
                        </h3>
                        <div style={{ display: "grid", gap: "0.5rem", fontSize: "0.9em", color: "var(--text-color)" }}>
                          <div><strong>CID:</strong> {cancellation.trainee.cid}</div>
                          <div><strong>Grund für Abbruch:</strong></div>
                          <div style={{ 
                            backgroundColor: "rgba(0, 0, 0, 0.05)", 
                            padding: "0.75rem", 
                            borderRadius: "6px", 
                            whiteSpace: "pre-wrap",
                            color: "var(--text-color)"
                          }}>
                            {cancellation.cancellationReason}
                          </div>
                          <div><strong>Angefordert am:</strong> {new Date(cancellation.cancellationAt).toLocaleString("de-DE")}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button
                          onClick={() => approveCancellation(cancellation.id, "delete")}
                          disabled={approvingCancellation === cancellation.id}
                          className="button button--danger"
                          style={{ margin: 0 }}
                        >
                          {approvingCancellation === cancellation.id ? "Wird bearbeitet..." : "Trainee löschen"}
                        </button>
                        <button
                          onClick={() => approveCancellation(cancellation.id, "reactivate")}
                          disabled={approvingCancellation === cancellation.id}
                          className="button"
                          style={{ margin: 0 }}
                        >
                          {approvingCancellation === cancellation.id ? "Wird bearbeitet..." : "Wieder aktivieren"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* User Management Section */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <label htmlFor="search" style={{ fontWeight: 600, fontSize: "0.95em" }}>
                Suche:
              </label>
              <input
                id="search"
                type="text"
                placeholder="CID oder Name eingeben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ 
                  flex: 1, 
                  maxWidth: "400px", 
                  padding: "8px 12px", 
                  fontSize: "0.9em",
                  margin: 0
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="button"
                  style={{ padding: "8px 16px", fontSize: "0.85em", margin: 0 }}
                >
                  Zurücksetzen
                </button>
              )}
              <span style={{ fontSize: "0.85em", color: "var(--text-color)", marginLeft: "auto" }}>
                {sortedAndFilteredUsers.length} {sortedAndFilteredUsers.length === 1 ? "Benutzer" : "Benutzer"}
              </span>
            </div>
          </div>
          <div className="card" style={{ overflowX: "auto", overflowY: "hidden", marginBottom: "1.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--footer-border)" }}>
                  <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: 600 }}>CID</th>
                  <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: 600 }}>Name</th>
                  <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: 600 }}>Email</th>
                  <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: 600 }}>Role</th>
                  <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: 600 }}>Joined</th>
                  <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--footer-border)" }}>
                    <td style={{ padding: "10px 8px", fontSize: "0.9em", fontFamily: "monospace" }}>
                      {user.cid}
                    </td>
                    <td style={{ padding: "10px 8px", fontSize: "0.9em" }}>{user.name}</td>
                    <td style={{ padding: "10px 8px", fontSize: "0.9em" }}>
                      {user.email || "-"}
                    </td>
                    <td style={{ padding: "10px 8px", fontSize: "0.9em" }}>
                      {userRole === "ADMIN" || userRole === "PMP_LEITUNG" ? (
                        <select
                          value={user.role}
                          onChange={(e) =>
                            updateUserRole(user.id, e.target.value as UserRole)
                          }
                          disabled={updating === user.id}
                          className="form-select"
                          style={{ maxWidth: "160px", padding: "6px 8px", fontSize: "0.9em" }}
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: "0.9em" }}>{user.role}</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 8px", fontSize: "0.9em" }}>
                      {userRole === "ADMIN" || userRole === "PMP_LEITUNG" ? (
                        <select
                          value={user.userStatus || ""}
                          onChange={(e) =>
                            updateUserStatus(user.id, e.target.value as UserStatus)
                          }
                          disabled={updating === user.id}
                          className="form-select"
                          style={{ maxWidth: "180px", padding: "6px 8px", fontSize: "0.9em" }}
                        >
                          {userStatuses.map((status) => (
                            <option key={status || "none"} value={status}>
                              {status || "Active"}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: "0.9em" }}>{user.userStatus || "Active"}</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 8px", fontSize: "0.9em" }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      {userRole === "ADMIN" && user.role !== "ADMIN" && (
                        <button
                          onClick={() => promoteToAdmin(user.id)}
                          disabled={updating === user.id}
                          className="button button--danger"
                          style={{ padding: "6px 12px", fontSize: "0.85em", margin: 0 }}
                        >
                          Befördern
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ borderLeft: "4px solid var(--accent-color)" }}>
            <h3 style={{ marginTop: 0 }}>Deine Rolle: {userRole}</h3>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.95em" }}>
              {userRole === "ADMIN" && (
                "Sie haben vollen Zugriff, um alle Benutzer und Rollen zu verwalten."
              )}
              {userRole === "PMP_LEITUNG" && (
                "Sie können Rollen anzeigen und aktualisieren, aber nicht zum ADMIN befördern."
              )}
            </p>
          </div>
        </>
      )}
    </PageLayout>
  );
}
