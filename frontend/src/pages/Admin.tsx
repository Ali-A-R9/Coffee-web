import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Building2,
  Check,
  CircleOff,
  Coffee,
  Gauge,
  HeartPulse,
  Pencil,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  Wrench,
  LogOut,
  Clock3,
} from "lucide-react";
import { logout } from "../api/authApi";
import { getAllCafes, saveCafeAdmin } from "../api/cafeApi";


type AdminSection = "dashboard" | "cafes" | "pending" | "health" | "settings";
type CafeStatus = "Active" | "Pending";

type CafeRecord = {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  createdDate: string;
  status: CafeStatus;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  description: string;
  websiteUrl: string;
  plan: string;
};

const initialCafes: CafeRecord[] = [
  {
    id: "brew-bean",
    name: "Brew & Bean",
    ownerName: "John Smith",
    ownerEmail: "owner@brewbean.com",
    phone: "+1 (555) 123-4567",
    createdDate: "Jan 15, 2025",
    status: "Pending",
    address: "123 Main Street, Downtown",
    city: "Seattle",
    state: "WA",
    zipCode: "98101",
    description:
      "A cozy neighborhood cafe serving artisanal coffee and fresh pastries. Perfect spot for remote work or catching up with friends.",
    websiteUrl: "https://brewbean.cafesite.com",
    plan: "Free Trial",
  },
  {
    id: "daily-grind",
    name: "The Daily Grind",
    ownerName: "Jane Doe",
    ownerEmail: "contact@dailygrind.com",
    phone: "+1 (555) 890-1122",
    createdDate: "Jan 10, 2025",
    status: "Active",
    address: "212 Pine St",
    city: "Seattle",
    state: "WA",
    zipCode: "98122",
    description: "Fast and friendly morning coffee spot for local commuters.",
    websiteUrl: "https://dailygrind.cafesite.com",
    plan: "Pro",
  },
  {
    id: "espresso-express",
    name: "Espresso Express",
    ownerName: "Mike Johnson",
    ownerEmail: "hello@espressoexpress.com",
    phone: "+1 (555) 334-7788",
    createdDate: "Jan 8, 2025",
    status: "Active",
    address: "98 Lake Ave",
    city: "Seattle",
    state: "WA",
    zipCode: "98109",
    description: "Quick-service espresso bar with premium beans.",
    websiteUrl: "https://espressoexpress.cafesite.com",
    plan: "Pro",
  },
  {
    id: "latte-love",
    name: "Latte Love Cafe",
    ownerName: "Sarah Wilson",
    ownerEmail: "info@lattelove.com",
    phone: "+1 (555) 777-9001",
    createdDate: "Jan 5, 2025",
    status: "Pending",
    address: "44 3rd Ave",
    city: "Seattle",
    state: "WA",
    zipCode: "98104",
    description: "Specialty drinks and cozy brunch vibes.",
    websiteUrl: "https://lattelove.cafesite.com",
    plan: "Free Trial",
  },
  {
    id: "mocha-moments",
    name: "Mocha Moments",
    ownerName: "Tom Brown",
    ownerEmail: "owner@mochamoments.com",
    phone: "+1 (555) 773-2200",
    createdDate: "Dec 28, 2024",
    status: "Active",
    address: "17 Westlake Blvd",
    city: "Seattle",
    state: "WA",
    zipCode: "98121",
    description: "Neighborhood cafe known for pastries and mocha blends.",
    websiteUrl: "https://mochamoments.cafesite.com",
    plan: "Starter",
  },
];

function Admin() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [cafes, setCafes] = useState<CafeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null);
  const [detailMessage, setDetailMessage] = useState("");

  const [siteName, setSiteName] = useState("CafeSite");
  const [supportEmail, setSupportEmail] = useState("support@cafesite.com");
  const [maxCafesPerUser, setMaxCafesPerUser] = useState("5");
  const [autoApproval, setAutoApproval] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [minimumPasswordLength, setMinimumPasswordLength] = useState("8");
  const [requireSpecialCharacters, setRequireSpecialCharacters] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);

  // Fetch data from localstorage
  useEffect(() => {
    setCafes(getAllCafes());
  }, []);


  const filteredCafes = useMemo(() => {
    const key = searchTerm.trim().toLowerCase();
    if (!key) return cafes;

    return cafes.filter((cafe) => {
      return (
        cafe.name.toLowerCase().includes(key) ||
        cafe.ownerEmail.toLowerCase().includes(key) ||
        cafe.ownerName.toLowerCase().includes(key)
      );
    });
  }, [searchTerm, cafes]);

  const pendingCafes = useMemo(
    () => cafes.filter((cafe) => cafe.status === "Pending"),
    [cafes]
  );

  const selectedCafe = useMemo(
    () => cafes.find((cafe) => cafe.id === selectedCafeId) || null,
    [selectedCafeId, cafes]
  );

  function handleLogout() {
    logout();
    navigate("/");
  }

  function updateCafe(cafeId: string, updates: Partial<CafeRecord>) {
    setCafes((prev) => prev.map((cafe) => (cafe.id === cafeId ? { ...cafe, ...updates } : cafe)));
    saveCafeAdmin(cafeId, updates);
  }

  function removeCafe(cafeId: string) {
    setCafes((prev) => prev.filter((cafe) => cafe.id !== cafeId));
    localStorage.removeItem(cafeId);
    if (selectedCafeId === cafeId) {
      setSelectedCafeId(null);
    }
  }

  function openCafeDetails(cafeId: string) {
    setSelectedCafeId(cafeId);
    setActiveSection("cafes");
    setDetailMessage("");
  }

  function renderStatusBadge(status: CafeStatus) {
    return <span className={`admin-status ${status.toLowerCase()}`}>{status}</span>;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div>
          <div className="admin-brand">
            <span className="admin-brand-icon">
              <Coffee size={15} />
            </span>
            <strong>CafeSite</strong>
          </div>

          <div className="admin-nav-group">
            <p>CAFE MANAGEMENT</p>
            <button
              type="button"
              className={activeSection === "dashboard" ? "active" : ""}
              onClick={() => {
                setActiveSection("dashboard");
                setSelectedCafeId(null);
              }}
            >
              <Building2 size={15} /> Dashboard
            </button>
            <button
              type="button"
              className={activeSection === "cafes" ? "active" : ""}
              onClick={() => setActiveSection("cafes")}
            >
              <Users size={15} /> All Cafes
            </button>
            <button
              type="button"
              className={activeSection === "pending" ? "active" : ""}
              onClick={() => setActiveSection("pending")}
            >
              <Clock3 size={15} /> Pending Approvals
            </button>
          </div>

          <div className="admin-nav-group">
            <p>SYSTEM OVERVIEW</p>
            <button
              type="button"
              className={activeSection === "health" ? "active" : ""}
              onClick={() => setActiveSection("health")}
            >
              <HeartPulse size={15} /> System Health
            </button>
            <button
              type="button"
              className={activeSection === "settings" ? "active" : ""}
              onClick={() => setActiveSection("settings")}
            >
              <Settings size={15} /> Settings
            </button>
          </div>
        </div>

        <div className="admin-sidebar-footer">
          <div>
            <strong>Admin User</strong>
            <span>admin@admin</span>
          </div>
          <button type="button" onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {activeSection === "dashboard" && (
          <section>
            <h1>System Dashboard</h1>
            <p className="admin-subtitle">Monitor platform performance and cafe activities</p>

            <div className="admin-stat-grid">
              <article>
                <span className="icon blue"><Building2 size={14} /></span>
                <strong>247</strong>
                <p>Total Cafes</p>
                <small>+12 new this month</small>
              </article>
              <article>
                <span className="icon green"><Activity size={14} /></span>
                <strong>124ms</strong>
                <p>Avg Response Time</p>
                <small>Healthy</small>
              </article>
              <article>
                <span className="icon purple"><Users size={14} /></span>
                <strong>1,234</strong>
                <p>Active Visitors</p>
                <small>+23% from last week</small>
              </article>
              <article>
                <span className="icon mint"><Gauge size={14} /></span>
                <strong>99.9%</strong>
                <p>System Uptime</p>
                <small>Last 30 days</small>
              </article>
            </div>

            <section className="admin-panel">
              <header>
                <h2>Recent Activity</h2>
                <p>Latest updates from cafe accounts</p>
              </header>
              <div className="admin-activity-list">
                {cafes.map((cafe, index) => (
                  <article key={cafe.id}>
                    <div className="left">
                      <span className="mini-icon"><Coffee size={14} /></span>
                      <div>
                        <strong>{cafe.name}</strong>
                        <p>Owner: {cafe.ownerName}</p>
                      </div>
                    </div>
                    <div className="right">
                      <p>{index % 2 === 0 ? "Pending Approval" : "Account Activated"}</p>
                      {renderStatusBadge(cafe.status)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>
        )}

        {activeSection === "cafes" && !selectedCafe && (
          <section>
            <h1>Registered Cafes</h1>
            <p className="admin-subtitle">Manage and review all cafe accounts</p>

            <section className="admin-panel admin-summary-strip">
              <div>
                <strong>247</strong>
                <p>Total Registered Cafes</p>
                <small>+12 new this month</small>
              </div>
              <div>
                <strong>Healthy</strong>
                <p>System Status</p>
              </div>
              <div>
                <strong>124ms</strong>
                <p>Response Time</p>
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-table-tools">
                <div className="admin-search">
                  <Search size={14} />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search cafes..."
                  />
                </div>
                <button type="button" className="admin-light-btn">
                  <Wrench size={14} /> Filter
                </button>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>CAFE NAME</th>
                      <th>OWNER EMAIL</th>
                      <th>STATUS</th>
                      <th>CREATED DATE</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCafes.map((cafe) => (
                      <tr key={cafe.id}>
                        <td>
                          <div className="admin-cafe-cell">
                            <span className="mini-icon"><Coffee size={13} /></span>
                            <span>{cafe.name}</span>
                          </div>
                        </td>
                        <td>{cafe.ownerEmail}</td>
                        <td>{renderStatusBadge(cafe.status)}</td>
                        <td>{cafe.createdDate}</td>
                        <td>
                          <div className="admin-actions">
                            {cafe.status === "Pending" && (
                              <button
                                type="button"
                                className="approve"
                                onClick={() => updateCafe(cafe.id, { status: "Active" })}
                              >
                                Approve
                              </button>
                            )}
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => openCafeDetails(cafe.id)}
                              aria-label="Open cafe details"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn danger"
                              onClick={() => removeCafe(cafe.id)}
                              aria-label="Delete cafe"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <footer className="admin-table-footer">
                <span>Showing 1 to {Math.min(filteredCafes.length, 5)} of 247 cafes</span>
                <div>
                  <button type="button" className="admin-light-btn">Previous</button>
                  <button type="button" className="admin-page-btn active">1</button>
                  <button type="button" className="admin-page-btn">2</button>
                  <button type="button" className="admin-page-btn">3</button>
                  <button type="button" className="admin-light-btn">Next</button>
                </div>
              </footer>
            </section>
          </section>
        )}

        {activeSection === "cafes" && selectedCafe && (
          <section>
            <button
              type="button"
              className="admin-back-btn"
              onClick={() => {
                setSelectedCafeId(null);
                setDetailMessage("");
              }}
            >
              <ArrowLeft size={14} /> Back to All Cafes
            </button>

            <h1>Cafe Details</h1>

            <section className="admin-panel admin-cafe-header">
              <div className="left">
                <span className="mini-icon"><Coffee size={16} /></span>
                <div>
                  <h3>{selectedCafe.name}</h3>
                  <p>Status: {renderStatusBadge(selectedCafe.status)}</p>
                  <p>Created: {selectedCafe.createdDate}</p>
                  <p>Owner: {selectedCafe.ownerName}</p>
                  <p>Contact: {selectedCafe.ownerEmail}</p>
                  <p>Phone: {selectedCafe.phone}</p>
                </div>
              </div>
              <div className="hint-box">
                Step 3: Admin selects a cafe to view details, review information, and take action.
              </div>
            </section>

            <section className="admin-panel">
              <header>
                <h2>Cafe Information</h2>
                <p>Edit basic metadata and contact details</p>
              </header>

              <div className="admin-form-grid">
                <div>
                  <label htmlFor="cafe-name">Cafe Name</label>
                  <input
                    id="cafe-name"
                    value={selectedCafe.name}
                    onChange={(e) => updateCafe(selectedCafe.id, { name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="owner-name">Owner Name</label>
                  <input
                    id="owner-name"
                    value={selectedCafe.ownerName}
                    onChange={(e) => updateCafe(selectedCafe.id, { ownerName: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="owner-email">Email Address</label>
                  <input
                    id="owner-email"
                    value={selectedCafe.ownerEmail}
                    onChange={(e) => updateCafe(selectedCafe.id, { ownerEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    value={selectedCafe.phone}
                    onChange={(e) => updateCafe(selectedCafe.id, { phone: e.target.value })}
                  />
                </div>
                <div className="full">
                  <label htmlFor="address">Address</label>
                  <input
                    id="address"
                    value={selectedCafe.address}
                    onChange={(e) => updateCafe(selectedCafe.id, { address: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    value={selectedCafe.city}
                    onChange={(e) => updateCafe(selectedCafe.id, { city: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="state">State</label>
                  <input
                    id="state"
                    value={selectedCafe.state}
                    onChange={(e) => updateCafe(selectedCafe.id, { state: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="zip">Zip Code</label>
                  <input
                    id="zip"
                    value={selectedCafe.zipCode}
                    onChange={(e) => updateCafe(selectedCafe.id, { zipCode: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="plan">Subscription Plan</label>
                  <select
                    id="plan"
                    value={selectedCafe.plan}
                    onChange={(e) => updateCafe(selectedCafe.id, { plan: e.target.value })}
                  >
                    <option>Free Trial</option>
                    <option>Starter</option>
                    <option>Pro</option>
                    <option>Enterprise</option>
                  </select>
                </div>
                <div className="full">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    rows={3}
                    value={selectedCafe.description}
                    onChange={(e) => updateCafe(selectedCafe.id, { description: e.target.value })}
                  />
                </div>
                <div className="full">
                  <label htmlFor="website">Website URL</label>
                  <input
                    id="website"
                    value={selectedCafe.websiteUrl}
                    onChange={(e) => updateCafe(selectedCafe.id, { websiteUrl: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-detail-actions">
                <button
                  type="button"
                  className="approve"
                  onClick={() => {
                    updateCafe(selectedCafe.id, { status: "Active" });
                    setDetailMessage("Cafe approved successfully.");
                  }}
                >
                  <Check size={13} /> Approve Cafe
                </button>
                <button
                  type="button"
                  className="neutral"
                  onClick={() => {
                    updateCafe(selectedCafe.id, { status: "Pending" });
                    setDetailMessage("Cafe moved to pending.");
                  }}
                >
                  <CircleOff size={13} /> Unapprove
                </button>
                <button
                  type="button"
                  className="dark"
                  onClick={() => setDetailMessage("Edits saved successfully.")}
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    removeCafe(selectedCafe.id);
                    setDetailMessage("Cafe removed.");
                  }}
                >
                  <Trash2 size={13} /> Remove Cafe
                </button>
              </div>
              <div className="admin-note">
                Note: Use action buttons to approve, save edits, or remove this cafe. The system will show a confirmation.
              </div>
              {detailMessage && <p className="admin-message">{detailMessage}</p>}
            </section>
          </section>
        )}

        {activeSection === "pending" && (
          <section>
            <h1>Pending Approvals</h1>
            <p className="admin-subtitle">Review and approve new cafe applications</p>

            <section className="admin-panel admin-warning">
              <div>
                <strong>{pendingCafes.length}</strong>
                <p>Cafes awaiting approval</p>
              </div>
              <Clock3 size={32} />
            </section>

            <div className="admin-pending-list">
              {pendingCafes.map((cafe, index) => (
                <article key={cafe.id} className="admin-panel admin-pending-card">
                  <div className="left">
                    <span className="mini-icon"><Coffee size={14} /></span>
                    <div>
                      <h3>{cafe.name}</h3>
                      <p>Owner: {cafe.ownerName}</p>
                      <p>Submitted: {cafe.createdDate}</p>
                      <div className="actions">
                        <button
                          type="button"
                          className="approve"
                          onClick={() => updateCafe(cafe.id, { status: "Active" })}
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          type="button"
                          className="reject"
                          onClick={() => removeCafe(cafe.id)}
                        >
                          <CircleOff size={13} /> Reject
                        </button>
                        <button type="button" className="neutral" onClick={() => openCafeDetails(cafe.id)}>
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="right">
                    <p>Email: {cafe.ownerEmail}</p>
                    <p>Waiting: {index + 2} days ago</p>
                    {renderStatusBadge(cafe.status)}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeSection === "health" && (
          <section>
            <h1>System Health</h1>
            <p className="admin-subtitle">Monitor platform performance and infrastructure</p>

            <section className="admin-panel admin-ok">
              <div>
                <strong>All Systems Operational</strong>
                <p>Platform is running smoothly with no issues detected</p>
              </div>
              <ShieldCheck size={28} />
            </section>

            <div className="admin-stat-grid compact">
              <article>
                <span className="icon green"><Activity size={14} /></span>
                <strong>99.9%</strong>
                <p>System Uptime</p>
              </article>
              <article>
                <span className="icon green"><Gauge size={14} /></span>
                <strong>124ms</strong>
                <p>API Response Time</p>
              </article>
              <article>
                <span className="icon green"><Building2 size={14} /></span>
                <strong>Optimal</strong>
                <p>Database Health</p>
              </article>
              <article>
                <span className="icon green"><Settings size={14} /></span>
                <strong>34%</strong>
                <p>CPU Usage</p>
              </article>
            </div>

            <section className="admin-panel">
              <header>
                <h2>Performance Metrics</h2>
              </header>
              <div className="admin-metric-list">
                <div>
                  <p>API Response Time</p>
                  <strong>124ms</strong>
                  <span style={{ width: "12%" }} />
                </div>
                <div>
                  <p>Database Query Time</p>
                  <strong>45ms</strong>
                  <span style={{ width: "9%" }} />
                </div>
                <div>
                  <p>CPU Usage</p>
                  <strong>34%</strong>
                  <span style={{ width: "34%" }} />
                </div>
                <div>
                  <p>Memory Usage</p>
                  <strong>58%</strong>
                  <span style={{ width: "58%", background: "#d97706" }} />
                </div>
              </div>
            </section>

            <section className="admin-panel">
              <header>
                <h2>Uptime History (Last 30 Days)</h2>
              </header>
              <div className="admin-uptime-grid">
                {Array.from({ length: 30 }).map((_, i) => (
                  <span key={i} />
                ))}
              </div>
            </section>
          </section>
        )}

        {activeSection === "settings" && (
          <section>
            <h1>System Settings</h1>
            <p className="admin-subtitle">Configure platform-wide settings and preferences</p>

            <section className="admin-panel">
              <header>
                <h2>General Settings</h2>
              </header>
              <div className="admin-form-grid">
                <div className="full">
                  <label htmlFor="site-name">Site Name</label>
                  <input id="site-name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                </div>
                <div className="full">
                  <label htmlFor="support-email">Support Email</label>
                  <input
                    id="support-email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                  />
                </div>
                <div className="full">
                  <label htmlFor="max-cafe-user">Max Cafes Per User</label>
                  <input
                    id="max-cafe-user"
                    value={maxCafesPerUser}
                    onChange={(e) => setMaxCafesPerUser(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="admin-panel">
              <header>
                <h2>Feature Toggles</h2>
              </header>
              <div className="admin-toggle-list">
                <label>
                  <div>
                    <strong>Auto-Approval for New Cafes</strong>
                    <span>Automatically approve new cafe registrations</span>
                  </div>
                  <input type="checkbox" checked={autoApproval} onChange={(e) => setAutoApproval(e.target.checked)} />
                </label>
                <label>
                  <div>
                    <strong>Email Notifications</strong>
                    <span>Send email notifications for important events</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                </label>
                <label>
                  <div>
                    <strong>Maintenance Mode</strong>
                    <span>Temporarily disable public access to the platform</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                  />
                </label>
              </div>
            </section>

            <section className="admin-panel">
              <header>
                <h2>Password Policies</h2>
              </header>
              <div className="admin-form-grid">
                <div className="full">
                  <label htmlFor="min-pass-len">Minimum Password Length</label>
                  <input
                    id="min-pass-len"
                    value={minimumPasswordLength}
                    onChange={(e) => setMinimumPasswordLength(e.target.value)}
                  />
                </div>
                <div className="full admin-checkbox-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={requireSpecialCharacters}
                      onChange={(e) => setRequireSpecialCharacters(e.target.checked)}
                    />
                    <span>
                      <strong>Require Special Characters</strong>
                      <small>Passwords must include at least one special character</small>
                    </span>
                  </label>
                </div>
                <div className="full admin-checkbox-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={requireNumbers}
                      onChange={(e) => setRequireNumbers(e.target.checked)}
                    />
                    <span>
                      <strong>Require Numbers</strong>
                      <small>Passwords must include at least one number</small>
                    </span>
                  </label>
                </div>
              </div>
            </section>

            <button type="button" className="admin-save-btn">
              Save Changes
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default Admin;
