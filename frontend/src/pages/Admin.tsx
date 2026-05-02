import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Coffee,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  XCircle,
} from "lucide-react";
import { logout } from "../api/authApi";
import { getAllCafes, updateCafeStatus } from "../api/cafeApi";
import { useUiTheme } from "../hooks/useUiTheme";

type AdminCafe = {
  _id: string;
  name: string;
  description?: string;
  status?: "Pending" | "Active" | "Declined";
  adminComment?: string;
  ownerId?: {
    email?: string;
    fullName?: string;
  };
  updatedAt?: string;
};

type AdminView = "all" | "approved" | "pending" | "declined";

const viewLabels: Record<AdminView, string> = {
  all: "All Cafes",
  approved: "Approved Cafes",
  pending: "Pending Cafes",
  declined: "Declined Cafes",
};

function getStatusClass(status?: string) {
  if (status === "Active") return "admin-status active";
  if (status === "Declined") return "admin-status declined";
  return "admin-status pending";
}

function Admin() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useUiTheme("admin-dashboard-theme");
  const [cafes, setCafes] = useState<AdminCafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [activeView, setActiveView] = useState<AdminView>("all");

  useEffect(() => {
    async function fetchCafes() {
      try {
        const data = await getAllCafes();
        setCafes(data);
      } catch (error) {
        console.error("Failed to fetch cafes:", error);
        setCafes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCafes();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const counts = useMemo(() => {
    return {
      all: cafes.length,
      approved: cafes.filter((cafe) => cafe.status === "Active").length,
      pending: cafes.filter((cafe) => !cafe.status || cafe.status === "Pending").length,
      declined: cafes.filter((cafe) => cafe.status === "Declined").length,
    };
  }, [cafes]);

  const visibleCafes = useMemo(() => {
    if (activeView === "approved") {
      return cafes.filter((cafe) => cafe.status === "Active");
    }

    if (activeView === "pending") {
      return cafes.filter((cafe) => !cafe.status || cafe.status === "Pending");
    }

    if (activeView === "declined") {
      return cafes.filter((cafe) => cafe.status === "Declined");
    }

    return cafes;
  }, [activeView, cafes]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function handleStatusChange(
    cafe: AdminCafe,
    status: "Active" | "Declined",
    adminComment = ""
  ) {
    try {
      const updatedCafe = await updateCafeStatus(cafe._id, status, adminComment);
      setCafes((prev) =>
        prev.map((item) => (item._id === cafe._id ? updatedCafe : item))
      );

      if (status === "Active") {
        setToast(`Cafe ${cafe.name} is approved`);
        setActiveView("approved");
      } else {
        setToast(`Cafe ${cafe.name} is declined`);
        setActiveView("declined");
      }
    } catch (error) {
      console.error("Failed to update cafe status:", error);
      setToast(error instanceof Error ? error.message : "Failed to update cafe status");
    }
  }

  function handleDecline(cafe: AdminCafe) {
    const comment = window.prompt(
      `Short comment for ${cafe.name}'s owner:`,
      cafe.adminComment || ""
    );

    if (comment === null) return;

    handleStatusChange(cafe, "Declined", comment);
  }

  if (loading) {
    return (
      <div className={`admin-layout admin-loading ${isDark ? "admin-dark" : ""}`}>
        <main className="admin-main">
          <h2>Loading admin dashboard...</h2>
        </main>
      </div>
    );
  }

  const navItems: Array<{ key: AdminView; label: string; icon: React.ReactNode }> = [
    { key: "all", label: "All Cafes", icon: <LayoutDashboard size={16} /> },
    { key: "approved", label: "Approved Cafes", icon: <ShieldCheck size={16} /> },
    { key: "pending", label: "Pending Cafes", icon: <ListChecks size={16} /> },
    { key: "declined", label: "Declined Cafes", icon: <XCircle size={16} /> },
  ];

  return (
    <div className={`admin-layout ${isDark ? "admin-dark" : ""}`}>
      {toast && (
        <div className="owner-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}

      <aside className="admin-sidebar">
        <div>
          <div className="admin-brand">
            <span className="admin-brand-icon">
              <Coffee size={16} />
            </span>
            <strong>CafeSite</strong>
          </div>

          <nav className="admin-nav-group" aria-label="Admin sections">
            <p>ADMIN WORKSPACE</p>
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={activeView === item.key ? "active" : ""}
                onClick={() => setActiveView(item.key)}
              >
                {item.icon}
                <span>{item.label}</span>
                <small>{counts[item.key]}</small>
              </button>
            ))}

            <button
              type="button"
              className="admin-theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch admin dashboard to light theme" : "Switch admin dashboard to dark theme"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              <span>{isDark ? "Light Theme" : "Dark Theme"}</span>
            </button>
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <strong>Admin</strong>
          <span>Manage cafe approvals</span>
          <button type="button" onClick={handleLogout}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <h1>{viewLabels[activeView]}</h1>
        <p className="admin-subtitle">
          Review cafe submissions, approve ready cafes, or decline with a short owner note.
        </p>

        <section className="admin-stat-grid">
          <article>
            <span className="icon blue">
              <LayoutDashboard size={16} />
            </span>
            <strong>{counts.all}</strong>
            <p>All cafes</p>
          </article>
          <article>
            <span className="icon green">
              <ShieldCheck size={16} />
            </span>
            <strong>{counts.approved}</strong>
            <p>Approved cafes</p>
          </article>
          <article>
            <span className="icon purple">
              <ListChecks size={16} />
            </span>
            <strong>{counts.pending}</strong>
            <p>Pending cafes</p>
          </article>
          <article>
            <span className="icon mint">
              <XCircle size={16} />
            </span>
            <strong>{counts.declined}</strong>
            <p>Declined cafes</p>
          </article>
        </section>

        <section className="admin-panel">
          <header>
            <h2>{viewLabels[activeView]}</h2>
            <p>{visibleCafes.length} cafes in this view.</p>
          </header>

          {visibleCafes.length === 0 ? (
            <div className="admin-note">No cafes found in this section.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Cafe</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Description</th>
                    <th>Admin Comment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCafes.map((cafe) => {
                    const status = cafe.status || "Pending";

                    return (
                      <tr key={cafe._id}>
                        <td>
                          <div className="admin-cafe-cell">
                            <span className="mini-icon">
                              <Coffee size={14} />
                            </span>
                            <strong>{cafe.name}</strong>
                          </div>
                        </td>
                        <td>
                          <span className={getStatusClass(status)}>{status}</span>
                        </td>
                        <td>{cafe.ownerId?.email || "No owner email"}</td>
                        <td>{cafe.description || "No description"}</td>
                        <td>{cafe.adminComment || "None"}</td>
                        <td>
                          <div className="admin-actions">
                            {status !== "Active" && (
                              <button
                                type="button"
                                className="approve"
                                onClick={() => handleStatusChange(cafe, "Active")}
                              >
                                Approve
                              </button>
                            )}
                            <button
                              type="button"
                              className="icon-btn danger"
                              onClick={() => handleDecline(cafe)}
                            >
                              Decline
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Admin;
