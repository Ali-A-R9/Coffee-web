import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  Coffee,
  LogIn,
  LogOut,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";
import { getCurrentUser, logout } from "../api/authApi";
import { getPublicCafes, type PublicCafeData } from "../api/cafeApi";

type ViewMode = "list" | "menu" | "account";

type CartItem = {
  cafeId: string;
  cafeName: string;
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
};

type PaymentForm = {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

function formatHours(hours: PublicCafeData["hours"]) {
  if (!hours) return "Hours not available";
  if (typeof hours === "string") return hours;
  if (!hours.open || !hours.close) return "Hours not available";
  return `${hours.open} - ${hours.close}`;
}

function ClientView() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isLoggedIn = Boolean(currentUser);
  const canOrder = currentUser?.role === "client";

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [cafes, setCafes] = useState<PublicCafeData[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  useEffect(() => {
    async function loadCafes() {
      try {
        const data = await getPublicCafes();
        setCafes(data);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load cafes");
      } finally {
        setLoading(false);
      }
    }

    loadCafes();
  }, []);

  const filteredCafes = useMemo(() => {
    const key = searchTerm.trim().toLowerCase();
    if (!key) return cafes;

    return cafes.filter((cafe) => {
      return (
        (cafe.name || "").toLowerCase().includes(key) ||
        (cafe.description || "").toLowerCase().includes(key) ||
        (cafe.slug || "").toLowerCase().includes(key)
      );
    });
  }, [cafes, searchTerm]);

  const selectedCafe = useMemo(() => {
    return cafes.find((cafe) => cafe._id === selectedCafeId) || null;
  }, [cafes, selectedCafeId]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  function handleLogout() {
    logout();
    navigate("/");
    window.location.reload();
  }

  function openCafe(cafeId: string) {
    setSelectedCafeId(cafeId);
    setViewMode("menu");
    setMessage("");
  }

  function openAccount() {
    setViewMode("account");
    setMessage("");
  }

  function addToCart(itemId: string, itemName: string, price: string) {
    if (!selectedCafe) return;

    if (!isLoggedIn) {
      setMessage("Guests can explore cafes only. Please register or log in as a client to order.");
      navigate("/register");
      return;
    }

    if (!canOrder) {
      setMessage("Only client accounts can place orders.");
      return;
    }

    const numericPrice = Number(price);
    const safePrice = Number.isFinite(numericPrice) ? numericPrice : 0;
    const key = `${selectedCafe._id}:${itemId}`;

    setCart((prev) => {
      const existing = prev[key];
      return {
        ...prev,
        [key]: existing
          ? { ...existing, quantity: existing.quantity + 1 }
          : {
              cafeId: selectedCafe._id || "",
              cafeName: selectedCafe.name,
              itemId,
              itemName,
              price: safePrice,
              quantity: 1,
            },
      };
    });

    setMessage(`${itemName} added to cart.`);
  }

  function openCheckout() {
    setCheckoutOpen(true);
    setCheckoutMessage("");
    setOrderSuccess(false);
  }

  function closeCheckout() {
    setCheckoutOpen(false);
    setCheckoutMessage("");
  }

  function handlePaymentFieldChange<K extends keyof PaymentForm>(
    field: K,
    value: PaymentForm[K]
  ) {
    setPaymentForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function submitDemoPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (
      !paymentForm.cardholderName.trim() ||
      !paymentForm.cardNumber.trim() ||
      !paymentForm.expiry.trim() ||
      !paymentForm.cvv.trim()
    ) {
      setCheckoutMessage("Please complete all demo payment fields.");
      return;
    }

    setCheckoutMessage("Demo payment successful. Order confirmed.");
    setOrderSuccess(true);
    setCart({});
    setPaymentForm({
      cardholderName: "",
      cardNumber: "",
      expiry: "",
      cvv: "",
    });
    setMessage("Your demo order was placed successfully.");
  }

  function increase(key: string) {
    setCart((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        quantity: prev[key].quantity + 1,
      },
    }));
  }

  function decrease(key: string) {
    setCart((prev) => {
      const current = prev[key];
      if (!current) return prev;

      if (current.quantity === 1) {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [key]: {
          ...current,
          quantity: current.quantity - 1,
        },
      };
    });
  }

  if (loading) {
    return <p style={{ padding: "40px" }}>Loading cafes...</p>;
  }

  return (
    <div className="cx-app">
      <header className="cx-topbar">
        <div>
          <p className="cx-topbar-sub">Public Cafe Explorer</p>
          <h1>CafeSite</h1>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {viewMode !== "list" && (
            <button className="cx-notify" type="button" onClick={() => setViewMode("list")}>
              <ArrowLeft size={16} />
            </button>
          )}

          <button className="cx-notify" type="button" onClick={openAccount}>
            <UserRound size={16} />
          </button>

          {!isLoggedIn ? (
            <>
              <button className="cx-notify" type="button" onClick={() => navigate("/login")}>
                <LogIn size={16} />
              </button>
              <button className="cx-notify" type="button" onClick={() => navigate("/register")}>
                <Coffee size={16} />
              </button>
            </>
          ) : (
            <button className="cx-notify" type="button" onClick={handleLogout}>
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="cx-content">
        {viewMode === "list" && (
          <>
            <section className="cx-hero">
              <div>
                <p>Live cafes from the database</p>
                <h2>Browse Active Cafes</h2>
              </div>
              {!isLoggedIn && (
                <button type="button" onClick={() => navigate("/register")}>
                  <LogIn size={14} /> Register to Order
                </button>
              )}
            </section>

            <section className="cx-panel">
              <div className="cx-searchbar">
                <Search size={15} />
                <input
                  type="search"
                  placeholder="Search active cafes"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </section>

            {message && (
              <section className="cx-empty">
                <p>{message}</p>
              </section>
            )}

            {orderSuccess && (
              <section className="cx-panel">
                <h2 style={{ textAlign: "left" }}>Demo Order Confirmed</h2>
                <p className="small">
                  This was a test checkout only. No real payment was processed.
                </p>
              </section>
            )}

            <section className="cx-cafe-grid">
              {filteredCafes.map((cafe) => (
                <article className="cx-cafe-card" key={cafe._id}>
                  <div className="cx-cafe-head">
                    <div className="cx-cafe-icon" aria-hidden="true">
                      <Coffee size={15} />
                    </div>
                    <div>
                      <h3>{cafe.name}</h3>
                      <p>{cafe.description || "No description available."}</p>
                    </div>
                  </div>

                  <div className="cx-cafe-meta">
                    <span>
                      <MapPin size={13} /> {cafe.slug || "No slug"}
                    </span>
                    <span>
                      <Clock3 size={13} /> {formatHours(cafe.hours)}
                    </span>
                    <span className="open">{cafe.status}</span>
                  </div>

                  <div className="cx-cafe-actions">
                    <button
                      type="button"
                      className="primary"
                      onClick={() => openCafe(cafe._id || "")}
                    >
                      View Menu
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}

        {viewMode === "menu" && (
          <section className="cx-panel">
            {!selectedCafe ? (
              <section className="cx-empty">
                <p>Select a cafe from the home page first.</p>
              </section>
            ) : (
              <>
                <div className="cx-details-head">
                  <div className="cx-cafe-icon" aria-hidden="true">
                    <Coffee size={16} />
                  </div>
                  <div>
                    <h2>{selectedCafe.name}</h2>
                    <p>{selectedCafe.description || "No description available."}</p>
                  </div>
                </div>

                {!canOrder && (
                  <section className="cx-empty" style={{ marginTop: "12px" }}>
                    <p>
                      {isLoggedIn
                        ? "You can explore this cafe menu, but only client accounts can place orders."
                        : "Guests can explore this cafe menu, but ordering requires a registered client account."}
                    </p>
                  </section>
                )}

                {(selectedCafe.menu || []).length === 0 ? (
                  <section className="cx-empty">
                    <p>No menu items available.</p>
                  </section>
                ) : (
                  (selectedCafe.menu || []).map((category) => (
                    <section key={category.name} className="cx-menu-block">
                      <h3>{category.name}</h3>
                      {category.items.map((item) => (
                        <article key={item.id || item.name} className="cx-menu-item">
                          <div>
                            <strong>{item.name}</strong>
                          </div>
                          <div className="cx-item-actions">
                            <span>{item.price} SAR</span>
                            <button
                              type="button"
                              onClick={() =>
                                addToCart(item.id || item.name, item.name, item.price)
                              }
                            >
                              {canOrder ? "Add" : "Explore"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </section>
                  ))
                )}
              </>
            )}
          </section>
        )}

        {viewMode === "account" && (
          <section className="cx-panel">
            <div className="cx-account">
              <div className="avatar">
                <UserRound size={18} />
              </div>
              <div>
                <h3>{isLoggedIn ? currentUser?.fullName || "Account" : "Guest Session"}</h3>
                <p>
                  {isLoggedIn
                    ? `${currentUser?.email} (${currentUser?.role})`
                    : "Browse active cafes publicly. Register as a client if you want to place orders."}
                </p>
              </div>
            </div>

            <section className="cx-account-card">
              {isLoggedIn ? (
                <button type="button" className="cx-logout-btn" onClick={handleLogout}>
                  <LogOut size={14} /> Log out
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => navigate("/login")}>
                    <LogIn size={14} /> Log in
                  </button>
                  <button type="button" onClick={() => navigate("/register")}>
                    <Coffee size={14} /> Register
                  </button>
                </>
              )}
            </section>
          </section>
        )}

        {canOrder && cartItems.length > 0 && (
          <section className="cx-panel">
            <h2 style={{ textAlign: "left" }}>Cart</h2>
            {cartItems.map((item) => {
              const key = `${item.cafeId}:${item.itemId}`;
              return (
                <article className="cx-cart-item" key={key}>
                  <div>
                    <strong>{item.itemName}</strong>
                    <p>{item.cafeName}</p>
                  </div>
                  <div className="cx-qty-controls">
                    <button type="button" onClick={() => decrease(key)}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => increase(key)}>
                      +
                    </button>
                  </div>
                </article>
              );
            })}

            <section className="cx-summary">
              <div className="total">
                <span>Total</span>
                <strong>{total.toFixed(2)} SAR</strong>
              </div>
            </section>

            <button type="button" className="cx-cta" onClick={openCheckout}>
              Proceed to Demo Checkout
            </button>
          </section>
        )}

        {canOrder && checkoutOpen && (
          <section className="cx-panel">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
              <div>
                <h2 style={{ textAlign: "left" }}>Demo Checkout</h2>
                <p className="small">
                  This is a fake payment form for testing only. No real payment will be taken.
                </p>
              </div>
              <button type="button" className="ghost" onClick={closeCheckout}>
                Close
              </button>
            </div>

            <form className="form-inline" onSubmit={submitDemoPayment}>
              <label>Cardholder Name</label>
              <input
                type="text"
                value={paymentForm.cardholderName}
                onChange={(e) => handlePaymentFieldChange("cardholderName", e.target.value)}
                placeholder="Test User"
              />

              <label>Card Number</label>
              <input
                type="text"
                value={paymentForm.cardNumber}
                onChange={(e) => handlePaymentFieldChange("cardNumber", e.target.value)}
                placeholder="4111 1111 1111 1111"
              />

              <label>Expiry</label>
              <input
                type="text"
                value={paymentForm.expiry}
                onChange={(e) => handlePaymentFieldChange("expiry", e.target.value)}
                placeholder="12/29"
              />

              <label>CVV</label>
              <input
                type="text"
                value={paymentForm.cvv}
                onChange={(e) => handlePaymentFieldChange("cvv", e.target.value)}
                placeholder="123"
              />

              <section className="cx-summary">
                <div className="total">
                  <span>Demo Total</span>
                  <strong>{total.toFixed(2)} SAR</strong>
                </div>
              </section>

              <button type="submit" className="cx-cta">
                Pay with Demo Payment
              </button>
            </form>

            {checkoutMessage && (
              <section className="cx-empty" style={{ marginTop: "12px" }}>
                <p>{checkoutMessage}</p>
              </section>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default ClientView;
