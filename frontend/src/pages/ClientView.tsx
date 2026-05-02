import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  Coffee,
  LogIn,
  LogOut,
  MapPin,
  Moon,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import { getCurrentUser, logout } from "../api/authApi";
import { getPublicCafes, type PublicCafeData } from "../api/cafeApi";
import CafeMenuVisualization from "../components/CafeMenuVisualization";
import { useUiTheme } from "../hooks/useUiTheme";

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

type PaymentNotice = {
  type: "error" | "success";
  title: string;
  message: string;
  note?: string;
};

function formatShortTime(value?: string) {
  if (!value) return "";

  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value;

  const hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function formatHours(hours: PublicCafeData["hours"]) {
  if (!hours) return "Hours not available";
  if (typeof hours === "string") return hours;
  if (!hours.open || !hours.close) return "Hours not available";
  return `${formatShortTime(hours.open)} - ${formatShortTime(hours.close)}`;
}

function getCurrentMonthValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function getDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCardNumber(value: string) {
  return getDigits(value)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function normalizeCardholderName(value: string) {
  return value.slice(0, 60);
}

function ClientView() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const { isDark, toggleTheme } = useUiTheme("customer-menu-theme");
  const currentUser = getCurrentUser();
  const isLoggedIn = Boolean(currentUser);
  const canOrder = currentUser?.role === "client";

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [cafes, setCafes] = useState<PublicCafeData[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState("");
  const [activeMenuCategory, setActiveMenuCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<PaymentNotice | null>(null);
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

  useEffect(() => {
    if (!slug || loading) return;

    const cafeFromSlug = cafes.find((cafe) => cafe.slug === slug);

    if (cafeFromSlug?._id) {
      openCafe(cafeFromSlug._id);
      return;
    }

    setViewMode("list");
    setMessage("Cafe menu is not available yet. It may still need admin approval.");
  }, [slug, cafes, loading]);

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

  const selectedMenu = useMemo(() => selectedCafe?.menu || [], [selectedCafe]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );
  const minExpiryMonth = getCurrentMonthValue();

  function handleLogout() {
    logout();
    navigate("/");
    window.location.reload();
  }

  function openCafe(cafeId: string) {
    setSelectedCafeId(cafeId);
    setActiveMenuCategory("all");
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
    setPaymentNotice(null);
    setOrderSuccess(false);
  }

  function closeCheckout() {
    setCheckoutOpen(false);
    setPaymentNotice(null);
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

  function showPaymentPopup(
    type: PaymentNotice["type"],
    title: string,
    popupMessage: string,
    note = ""
  ) {
    setPaymentNotice({
      type,
      title,
      message: popupMessage,
      note,
    });
  }

  function handleCardholderNameChange(value: string) {
    handlePaymentFieldChange("cardholderName", normalizeCardholderName(value));
  }

  function handleCardNumberChange(value: string) {
    handlePaymentFieldChange("cardNumber", formatCardNumber(value));
  }

  function handleCvvChange(value: string) {
    handlePaymentFieldChange("cvv", getDigits(value).slice(0, 4));
  }

  function validatePaymentForm() {
    const cardholderName = paymentForm.cardholderName.trim();
    const cardNumberDigits = getDigits(paymentForm.cardNumber);
    const cvvDigits = getDigits(paymentForm.cvv);

    if (!cardholderName || !cardNumberDigits || !paymentForm.expiry || !cvvDigits) {
      return {
        title: "Complete payment details",
        message: "Please fill in cardholder name, card number, expiry month, and CVV.",
      };
    }

    if (!/^[A-Za-z][A-Za-z .'-]{1,}$/.test(cardholderName)) {
      return {
        title: "Use English name only",
        message: "Cardholder name must use English letters only, like Test User.",
      };
    }

    if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) {
      return {
        title: "Invalid card number format",
        message: "Card number must contain 13 to 19 digits. Fake test numbers are okay if the format is correct.",
      };
    }

    if (!/^\d{4}-\d{2}$/.test(paymentForm.expiry)) {
      return {
        title: "Choose expiry month",
        message: "Please select the card expiry month using the date picker.",
      };
    }

    if (paymentForm.expiry < minExpiryMonth) {
      return {
        title: "Card date is expired",
        message: "The expiry month cannot be in the past. Please choose the current month or a future month.",
      };
    }

    if (!/^\d{3,4}$/.test(cvvDigits)) {
      return {
        title: "Invalid CVV format",
        message: "CVV must be 3 or 4 digits only.",
      };
    }

    return null;
  }

  function submitDemoPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validatePaymentForm();
    if (validationError) {
      showPaymentPopup("error", validationError.title, validationError.message);
      return;
    }

    showPaymentPopup(
      "success",
      "Payment approved",
      "Your order was confirmed.",
      "Note: demo payment only. No real payment was processed."
    );
    setOrderSuccess(true);
    setCart({});
    setCheckoutOpen(false);
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
    return (
      <div className={`cx-app ${isDark ? "cx-dark" : ""}`}>
        <main className="cx-content">
          <section className="cx-panel">
            <p>Loading cafes...</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={`cx-app ${isDark ? "cx-dark" : ""}`}>
      <header className="cx-topbar">
        <div>
          <p className="cx-topbar-sub">Public Cafe Explorer</p>
          <h1>CafeSite</h1>
        </div>

        <div className="cx-topbar-actions">
          {viewMode !== "list" && (
            <button className="cx-notify" type="button" onClick={() => setViewMode("list")}>
              <ArrowLeft size={16} />
            </button>
          )}

          <button
            className="cx-notify cx-theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

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
                      {cafe.logoUrl ? <img src={cafe.logoUrl} alt="" /> : <Coffee size={15} />}
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
                    <span>{(cafe.menu || []).reduce((sum, category) => sum + category.items.length, 0)} items</span>
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
          <section className="cx-menu-page">
            {!selectedCafe ? (
              <section className="cx-empty">
                <p>Select a cafe from the home page first.</p>
              </section>
            ) : (
              <>
                <CafeMenuVisualization
                  cafe={selectedCafe}
                  menu={selectedMenu}
                  activeCategory={activeMenuCategory}
                  onCategoryChange={setActiveMenuCategory}
                  context="client"
                  canOrder={canOrder}
                  isLoggedIn={isLoggedIn}
                  onAddItem={(item, itemKey) => addToCart(item.id || itemKey, item.name, item.price)}
                />
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

        {paymentNotice && (
          <div className="cx-payment-popup-backdrop" role="presentation">
            <section
              className={`cx-payment-popup ${paymentNotice.type}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-popup-title"
            >
              <span className="cx-payment-popup-icon" aria-hidden="true">
                {paymentNotice.type === "success" ? "OK" : "!"}
              </span>
              <h2 id="payment-popup-title">{paymentNotice.title}</h2>
              <p>{paymentNotice.message}</p>
              {paymentNotice.note && <p className="cx-payment-note">{paymentNotice.note}</p>}
              <button type="button" onClick={() => setPaymentNotice(null)}>
                Close
              </button>
            </section>
          </div>
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

            <form className="form-inline" onSubmit={submitDemoPayment} noValidate>
              <label htmlFor="demo-cardholder-name">Cardholder Name</label>
              <input
                id="demo-cardholder-name"
                type="text"
                autoComplete="cc-name"
                value={paymentForm.cardholderName}
                onChange={(e) => handleCardholderNameChange(e.target.value)}
                placeholder="Test User"
              />

              <label htmlFor="demo-card-number">Card Number</label>
              <input
                id="demo-card-number"
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                value={paymentForm.cardNumber}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                placeholder="4111 1111 1111 1111"
              />

              <label htmlFor="demo-card-expiry">Expiry Month</label>
              <input
                id="demo-card-expiry"
                type="month"
                min={minExpiryMonth}
                autoComplete="cc-exp"
                value={paymentForm.expiry}
                onChange={(e) => handlePaymentFieldChange("expiry", e.target.value)}
              />

              <label htmlFor="demo-card-cvv">CVV</label>
              <input
                id="demo-card-cvv"
                type="text"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
                value={paymentForm.cvv}
                onChange={(e) => handleCvvChange(e.target.value)}
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
          </section>
        )}
      </main>
    </div>
  );
}

export default ClientView;
