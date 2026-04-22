import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/authApi";
import { getAllCafes, updateCafeStatus } from "../api/cafeApi";

function Admin() {
  const navigate = useNavigate();
  const [cafes, setCafes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function handleStatusChange(id: string, status: "Active" | "Pending") {
    try {
      const updatedCafe = await updateCafeStatus(id, status);
      setCafes((prev) =>
        prev.map((cafe) => (cafe._id === id ? updatedCafe : cafe))
      );
    } catch (error) {
      console.error("Failed to update cafe status:", error);
    }
  }

  if (loading) {
    return <h2 style={{ padding: "40px" }}>Loading admin dashboard...</h2>;
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "24px" }}>Admin Dashboard</h1>

      <button
        onClick={handleLogout}
        style={{
          width: "10%",
          padding: "14px",
          marginBottom: "28px",
          border: "none",
          borderRadius: "12px",
          backgroundColor: "#d9532b",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Logout
      </button>

      <h2 style={{ marginBottom: "20px" }}>All Cafes</h2>

      {cafes.length === 0 ? (
        <p>No cafes found.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "18px",
          }}
        >
          {cafes.map((cafe) => (
            <div
              key={cafe._id}
              style={{
                background: "#fff",
                borderRadius: "14px",
                padding: "16px",
                boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                border: "1px solid #eee",
                minHeight: "220px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ marginBottom: "10px", fontSize: "20px" }}>{cafe.name}</h3>

                <p style={{ margin: "6px 0", fontSize: "14px" }}>
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      color: cafe.status === "Active" ? "green" : "#b8860b",
                      fontWeight: "bold",
                    }}
                  >
                    {cafe.status || "Pending"}
                  </span>
                </p>

                <p style={{ margin: "6px 0", fontSize: "14px" }}>
                  <strong>Owner:</strong> {cafe.ownerId?.email || "No owner email"}
                </p>

                <p style={{ margin: "6px 0", fontSize: "14px" }}>
                  <strong>Description:</strong> {cafe.description || "No description"}
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button
                  onClick={() => handleStatusChange(cafe._id, "Active")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: "#28a745",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Approve
                </button>

                <button
                  onClick={() => handleStatusChange(cafe._id, "Pending")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: "#6c757d",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Pending
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Admin;