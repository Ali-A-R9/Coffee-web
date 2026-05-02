import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  Coffee,
  CreditCard,
  Home,
  LogIn,
  LogOut,
  Menu as MenuIcon,
  MapPin,
  Moon,
  ReceiptText,
  Search,
  ShoppingBag,
  Sun,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { getCurrentUser, logout } from "../api/authApi";
import { getPublicCafes, type PublicCafeData } from "../api/cafeApi";
import {
  createOrder,
  getClientOrders,
  type CafeOrder,
  type OrderStatus,
} from "../api/orderApi";
import CafeMenuVisualization from "../components/CafeMenuVisualization";
import { useUiTheme } from "../hooks/useUiTheme";

type ViewMode = "list" | "menu" | "account" | "orders";

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

type ClientAddress = {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  region: string;
  postalCode: string;
};

type SavedCardForm = PaymentForm & {
  label: string;
};

type SavedPaymentCard = {
  id: string;
  label: string;
  brand: string;
  cardholderName: string;
  last4: string;
  expiry: string;
  billingAddress: ClientAddress;
  createdAt: string;
};

type PaymentNotice = {
  type: "error" | "success";
  title: string;
  message: string;
  note?: string;
};

const EMPTY_ADDRESS: ClientAddress = {
  fullName: "",
  phone: "",
  line1: "",
  city: "",
  region: "",
  postalCode: "",
};

const EMPTY_SAVED_CARD_FORM: SavedCardForm = {
  label: "",
  cardholderName: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
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

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function timeToMinutes(value?: string) {
  if (!value) return null;

  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function getTodayHours(cafe: PublicCafeData) {
  const todayKey = DAY_KEYS[new Date().getDay()];
  const weeklyHours = todayKey ? cafe.workingHours?.[todayKey] : null;

  if (weeklyHours?.open && weeklyHours?.close) return weeklyHours;
  if (cafe.hours && typeof cafe.hours !== "string") return cafe.hours;
  return null;
}

function getOpenState(cafe: PublicCafeData) {
  const todayHours = getTodayHours(cafe);
  const openMinutes = timeToMinutes(todayHours?.open);
  const closeMinutes = timeToMinutes(todayHours?.close);

  if (openMinutes === null || closeMinutes === null) {
    return {
      className: "closed",
      label: "Hours not set",
    };
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isOpen =
    openMinutes <= closeMinutes
      ? nowMinutes >= openMinutes && nowMinutes <= closeMinutes
      : nowMinutes >= openMinutes || nowMinutes <= closeMinutes;

  return {
    className: isOpen ? "open" : "closed",
    label: isOpen ? "Open" : "Closed",
  };
}

function formatTodayHours(cafe: PublicCafeData) {
  return formatHours(getTodayHours(cafe) || cafe.hours);
}

function formatOrderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleString();
}

function formatExpiry(value: string) {
  if (!value) return "No expiry";

  const [year, month, day] = value.split("-");
  if (/^\d{4}$/.test(year || "") && /^\d{2}$/.test(month || "")) {
    return day ? `${day}/${month}/${year.slice(-2)}` : `${month}/${year.slice(-2)}`;
  }

  return value;
}

function getTodayDateValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
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

function getCardBrand(cardNumber: string) {
  const digits = getDigits(cardNumber);
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6/.test(digits)) return "Discover";
  return "Card";
}

function getOrderStatusClass(status: OrderStatus) {
  return `cx-order-status-chip ${status.toLowerCase().replace(/\s+/g, "-")}`;
}

function ClientView() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const { isDark, toggleTheme } = useUiTheme("customer-menu-theme");
  const currentUser = getCurrentUser();
  const isLoggedIn = Boolean(currentUser);
  const canOrder = currentUser?.role === "client";
  const clientStorageId = currentUser?.id || currentUser?.email || "guest";
  const addressStorageKey = `cafesite-address:${clientStorageId}`;
  const cardsStorageKey = `cafesite-cards:${clientStorageId}`;

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [cafes, setCafes] = useState<PublicCafeData[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState("");
  const [activeMenuCategory, setActiveMenuCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [orderHistory, setOrderHistory] = useState<CafeOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [clientAddress, setClientAddress] = useState<ClientAddress>(EMPTY_ADDRESS);
  const [savedCards, setSavedCards] = useState<SavedPaymentCard[]>([]);
  const [savedCardForm, setSavedCardForm] = useState<SavedCardForm>(EMPTY_SAVED_CARD_FORM);
  const [accountMessage, setAccountMessage] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [savedCardPickerOpen, setSavedCardPickerOpen] = useState(false);
  const [savedCardAddOpen, setSavedCardAddOpen] = useState(false);
  const [selectedSavedCardId, setSelectedSavedCardId] = useState("");
  const [savedCardCvv, setSavedCardCvv] = useState("");
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
    try {
      const storedAddress = window.localStorage.getItem(addressStorageKey);
      setClientAddress(storedAddress ? { ...EMPTY_ADDRESS, ...JSON.parse(storedAddress) } : EMPTY_ADDRESS);
    } catch {
      setClientAddress(EMPTY_ADDRESS);
    }
  }, [addressStorageKey]);

  useEffect(() => {
    try {
      const storedCards = window.localStorage.getItem(cardsStorageKey);
      setSavedCards(storedCards ? JSON.parse(storedCards) : []);
    } catch {
      setSavedCards([]);
    }
  }, [cardsStorageKey]);

  useEffect(() => {
    if (!canOrder) {
      setOrderHistory([]);
      return;
    }

    loadClientOrderHistory();
  }, [canOrder]);

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
  const minExpiryDate = getTodayDateValue();

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
    setSideNavOpen(false);
  }

  function openAccount() {
    setViewMode("account");
    setMessage("");
    setSideNavOpen(false);
  }

  function openOrders() {
    setViewMode("orders");
    setMessage("");
    setSideNavOpen(false);
    if (canOrder) {
      loadClientOrderHistory();
    }
  }

  function openCafeList() {
    setViewMode("list");
    setMessage("");
    setSideNavOpen(false);
    if (slug) navigate("/");
  }

  function handleCartFromDrawer() {
    setSideNavOpen(false);

    if (!canOrder) {
      setMessage("Only client accounts can place orders.");
      return;
    }

    if (cartItems.length === 0) {
      setMessage("Your cart is empty. Open a cafe menu and add items first.");
      setViewMode("list");
      return;
    }

    setCheckoutOpen(true);
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

  function handleAddressFieldChange<K extends keyof ClientAddress>(
    field: K,
    value: ClientAddress[K]
  ) {
    setClientAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleSavedCardFieldChange<K extends keyof SavedCardForm>(
    field: K,
    value: SavedCardForm[K]
  ) {
    setSavedCardForm((prev) => ({
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

  function saveCards(nextCards: SavedPaymentCard[]) {
    setSavedCards(nextCards);
    window.localStorage.setItem(cardsStorageKey, JSON.stringify(nextCards));
  }

  function validateAddress(address: ClientAddress) {
    if (
      !address.fullName.trim() ||
      !address.phone.trim() ||
      !address.line1.trim() ||
      !address.city.trim()
    ) {
      return "Please complete full name, phone, street address, and city.";
    }

    if (!/^\+?\d[\d\s-]{6,}$/.test(address.phone.trim())) {
      return "Phone number must use digits, spaces, +, or - only.";
    }

    return "";
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

  function handleSavedCardNameChange(value: string) {
    handleSavedCardFieldChange("cardholderName", normalizeCardholderName(value));
  }

  function handleSavedCardNumberChange(value: string) {
    handleSavedCardFieldChange("cardNumber", formatCardNumber(value));
  }

  function handleSavedCardCvvChange(value: string) {
    handleSavedCardFieldChange("cvv", getDigits(value).slice(0, 4));
  }

  function validateCardDetails(card: PaymentForm) {
    const cardholderName = card.cardholderName.trim();
    const cardNumberDigits = getDigits(card.cardNumber);
    const cvvDigits = getDigits(card.cvv);

    if (!cardholderName || !cardNumberDigits || !card.expiry || !cvvDigits) {
      return {
        title: "Complete payment details",
        message: "Please fill in cardholder name, card number, expiry date, and CVV.",
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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(card.expiry)) {
      return {
        title: "Choose expiry date",
        message: "Please select the card expiry date using the date picker.",
      };
    }

    if (card.expiry < minExpiryDate) {
      return {
        title: "Card date is expired",
        message: "The expiry date cannot be in the past. Please choose today or a future date.",
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

  function validatePaymentForm() {
    return validateCardDetails(paymentForm);
  }

  async function loadClientOrderHistory() {
    try {
      setOrdersLoading(true);
      const orders = await getClientOrders();
      setOrderHistory(orders);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load your orders.");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function completeDemoOrder(paymentMethod: string) {
    if (!selectedCafe?._id) {
      showPaymentPopup("error", "Choose a cafe", "Please open a cafe menu before placing an order.");
      return null;
    }

    if (cartItems.length === 0) {
      showPaymentPopup("error", "Cart is empty", "Please add menu items before checkout.");
      return null;
    }

    const addressError = validateAddress(clientAddress);
    if (addressError) {
      showPaymentPopup(
        "error",
        "Delivery address needed",
        `${addressError} Open Account to save your address, then return to checkout.`
      );
      return null;
    }

    try {
      const order = await createOrder({
        cafeId: selectedCafe._id,
        cafeName: selectedCafe.name,
        clientAddress,
        paymentMethod,
        items: cartItems.map((item) => ({
          itemId: item.itemId,
          name: item.itemName,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      setOrderHistory((prev) => [order, ...prev]);
      setOrderSuccess(true);
      setCart({});
      setCheckoutOpen(false);
      setSavedCardPickerOpen(false);
      setSavedCardAddOpen(false);
      setSavedCardCvv("");
      setMessage(`Order ${order.orderNumber} was sent to ${order.cafeName}.`);
      return order;
    } catch (error) {
      showPaymentPopup(
        "error",
        "Order was not placed",
        error instanceof Error ? error.message : "Failed to place this order."
      );
      return null;
    }
  }

  function saveClientAddress() {
    if (!canOrder) {
      showPaymentPopup("error", "Client account required", "Please log in as a client to save address details.");
      return;
    }

    const addressError = validateAddress(clientAddress);
    if (addressError) {
      setAccountMessage(addressError);
      showPaymentPopup("error", "Address needs attention", addressError);
      return;
    }

    window.localStorage.setItem(addressStorageKey, JSON.stringify(clientAddress));
    setAccountMessage("Address saved successfully.");
    showPaymentPopup("success", "Address saved", "Your delivery address was saved to this client account.");
  }

  function addSavedCard() {
    if (!canOrder) {
      showPaymentPopup("error", "Client account required", "Please log in as a client to save payment cards.");
      return;
    }

    const addressError = validateAddress(clientAddress);
    if (addressError) {
      showPaymentPopup("error", "Save address first", addressError);
      return;
    }

    const validationError = validateCardDetails(savedCardForm);
    if (validationError) {
      showPaymentPopup("error", validationError.title, validationError.message);
      return;
    }

    const digits = getDigits(savedCardForm.cardNumber);
    const nextCard: SavedPaymentCard = {
      id: `CARD-${Date.now()}`,
      label: savedCardForm.label.trim() || `${getCardBrand(savedCardForm.cardNumber)} ending ${digits.slice(-4)}`,
      brand: getCardBrand(savedCardForm.cardNumber),
      cardholderName: savedCardForm.cardholderName.trim(),
      last4: digits.slice(-4),
      expiry: savedCardForm.expiry,
      billingAddress: clientAddress,
      createdAt: new Date().toISOString(),
    };

    saveCards([nextCard, ...savedCards]);
    setSavedCardForm(EMPTY_SAVED_CARD_FORM);
    setSelectedSavedCardId(nextCard.id);
    setSavedCardAddOpen(false);

    if (savedCardPickerOpen) {
      setAccountMessage("Payment card saved. Select it and enter CVC to continue.");
      return;
    }

    setAccountMessage("Payment card saved successfully.");
    showPaymentPopup(
      "success",
      "Card saved",
      `${nextCard.label} is ready for future demo orders.`,
      "Note: CVC was validated but not saved."
    );
  }

  function removeSavedCard(cardId: string) {
    const nextCards = savedCards.filter((card) => card.id !== cardId);
    saveCards(nextCards);
    if (selectedSavedCardId === cardId) {
      setSelectedSavedCardId(nextCards[0]?.id || "");
    }
    setAccountMessage("Payment card removed.");
  }

  function openSavedCardPicker() {
    setPaymentNotice(null);
    setSavedCardPickerOpen(true);
    setSavedCardAddOpen(savedCards.length === 0);
    setSelectedSavedCardId((current) => current || savedCards[0]?.id || "");
    setSavedCardCvv("");
  }

  async function payWithSavedCard() {
    const selectedCard = savedCards.find((card) => card.id === selectedSavedCardId);
    const cvvDigits = getDigits(savedCardCvv);

    if (!selectedCard) {
      showPaymentPopup("error", "Choose a saved card", "Please select a saved card or add a new card first.");
      return;
    }

    if (!/^\d{3,4}$/.test(cvvDigits)) {
      showPaymentPopup("error", "Enter security code", "Please enter the card CVC/CVV as 3 or 4 digits. It will not be saved.");
      return;
    }

    const order = await completeDemoOrder(`${selectedCard.brand} ending ${selectedCard.last4}`);
    if (!order) return;

    showPaymentPopup(
      "success",
      "Payment approved",
      `Order ${order.orderNumber} was confirmed with ${selectedCard.brand} ending ${selectedCard.last4}.`,
      "Note: demo payment only. No real payment was processed."
    );
  }

  async function submitDemoPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validatePaymentForm();
    if (validationError) {
      showPaymentPopup("error", validationError.title, validationError.message);
      return;
    }

    const order = await completeDemoOrder("Manual demo card");
    if (!order) return;

    showPaymentPopup(
      "success",
      "Payment approved",
      `Order ${order.orderNumber} was confirmed and sent to ${order.cafeName}.`,
      "Note: demo payment only. No real payment was processed."
    );
    setPaymentForm({
      cardholderName: "",
      cardNumber: "",
      expiry: "",
      cvv: "",
    });
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
        const nextCart = { ...prev };
        delete nextCart[key];
        return nextCart;
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
            <button className="cx-notify" type="button" onClick={openCafeList} aria-label="Back to cafes">
              <ArrowLeft size={16} />
            </button>
          )}

          <button
            className="cx-notify"
            type="button"
            onClick={() => setSideNavOpen(true)}
            aria-label="Open client menu"
          >
            <MenuIcon size={17} />
          </button>
        </div>
      </header>

      {sideNavOpen && (
        <button
          type="button"
          className="cx-sidebar-backdrop"
          onClick={() => setSideNavOpen(false)}
          aria-label="Close client menu"
        />
      )}

      <aside className={`cx-sidebar ${sideNavOpen ? "open" : ""}`} aria-label="Client menu">
        <div className="cx-sidebar-head">
          <div>
            <p className="cx-kicker">Client Workspace</p>
            <h2>CafeSite</h2>
          </div>
          <button type="button" className="cx-notify" onClick={() => setSideNavOpen(false)} aria-label="Close menu">
            <X size={16} />
          </button>
        </div>

        <div className="cx-sidebar-profile">
          <div className="avatar">
            <UserRound size={18} />
          </div>
          <div>
            <strong>{isLoggedIn ? currentUser?.fullName || "Client" : "Guest"}</strong>
            <span>
              {isLoggedIn
                ? `${currentUser?.email} (${currentUser?.role})`
                : "Browse cafes or sign in to order"}
            </span>
          </div>
        </div>

        <nav className="cx-sidebar-nav">
          <button type="button" className={viewMode === "list" ? "active" : ""} onClick={openCafeList}>
            <Home size={16} />
            <span>Browse Cafes</span>
          </button>
          <button type="button" className={viewMode === "account" ? "active" : ""} onClick={openAccount}>
            <UserRound size={16} />
            <span>Account</span>
          </button>
          <button type="button" className={viewMode === "orders" ? "active" : ""} onClick={openOrders}>
            <ReceiptText size={16} />
            <span>Orders</span>
            <small>{orderHistory.length}</small>
          </button>
          <button type="button" onClick={handleCartFromDrawer}>
            <ShoppingBag size={16} />
            <span>Cart</span>
            <small>{cartItems.length}</small>
          </button>
          <button type="button" onClick={toggleTheme}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDark ? "Light Theme" : "Dark Theme"}</span>
          </button>
        </nav>

        <div className="cx-sidebar-foot">
          {!isLoggedIn ? (
            <>
              <button type="button" onClick={() => navigate("/login")}>
                <LogIn size={15} />
                Log in
              </button>
              <button type="button" onClick={() => navigate("/register")}>
                <Coffee size={15} />
                Register
              </button>
            </>
          ) : (
            <button type="button" className="danger" onClick={handleLogout}>
              <LogOut size={15} />
              Log out
            </button>
          )}
        </div>
      </aside>

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
                <h2 style={{ textAlign: "left" }}>Order Confirmed</h2>
                <p className="small">
                  Your latest order was sent to the cafe owner. Track live status in Orders.
                </p>
              </section>
            )}

            <section className="cx-cafe-grid">
              {filteredCafes.map((cafe) => {
                const openState = getOpenState(cafe);

                return (
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
                        <Clock3 size={13} /> {formatTodayHours(cafe)}
                      </span>
                      <span className={openState.className}>{openState.label}</span>
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
                );
              })}
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
          <section className="cx-account-stack">
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

            {canOrder && (
              <>
                <section className="cx-panel cx-account-management">
                  <div className="cx-orders-head">
                    <div>
                      <p className="cx-kicker">Delivery details</p>
                      <h2>Address</h2>
                    </div>
                  </div>

                  <div className="cx-profile-grid">
                    <div>
                      <label htmlFor="client-address-name">Full Name</label>
                      <input
                        id="client-address-name"
                        value={clientAddress.fullName}
                        onChange={(e) => handleAddressFieldChange("fullName", e.target.value)}
                        placeholder="Test User"
                      />
                    </div>
                    <div>
                      <label htmlFor="client-address-phone">Phone Number</label>
                      <input
                        id="client-address-phone"
                        value={clientAddress.phone}
                        onChange={(e) => handleAddressFieldChange("phone", e.target.value)}
                        placeholder="+966 5x xxx xxxx"
                      />
                    </div>
                    <div className="full">
                      <label htmlFor="client-address-line">Street Address</label>
                      <input
                        id="client-address-line"
                        value={clientAddress.line1}
                        onChange={(e) => handleAddressFieldChange("line1", e.target.value)}
                        placeholder="Building, street, district"
                      />
                    </div>
                    <div>
                      <label htmlFor="client-address-city">City</label>
                      <input
                        id="client-address-city"
                        value={clientAddress.city}
                        onChange={(e) => handleAddressFieldChange("city", e.target.value)}
                        placeholder="Dhahran"
                      />
                    </div>
                    <div>
                      <label htmlFor="client-address-region">Region</label>
                      <input
                        id="client-address-region"
                        value={clientAddress.region}
                        onChange={(e) => handleAddressFieldChange("region", e.target.value)}
                        placeholder="Eastern Province"
                      />
                    </div>
                    <div>
                      <label htmlFor="client-address-postal">Postal Code</label>
                      <input
                        id="client-address-postal"
                        value={clientAddress.postalCode}
                        onChange={(e) => handleAddressFieldChange("postalCode", e.target.value)}
                        placeholder="31261"
                      />
                    </div>
                  </div>

                  <button type="button" className="cx-cta cx-inline-cta" onClick={saveClientAddress}>
                    Save Address
                  </button>
                  {accountMessage && <p className="cx-account-message">{accountMessage}</p>}
                </section>

                <section className="cx-panel cx-account-management">
                  <div className="cx-orders-head">
                    <div>
                      <p className="cx-kicker">Payment methods</p>
                      <h2>Saved Cards</h2>
                    </div>
                    <span>{savedCards.length} cards</span>
                  </div>

                  <div className="cx-saved-card-list">
                    {savedCards.length === 0 ? (
                      <section className="cx-empty">
                        <CreditCard size={22} />
                        <h3>No saved cards yet</h3>
                        <p>Add a card once and use it for future demo orders.</p>
                      </section>
                    ) : (
                      savedCards.map((card) => (
                        <article className="cx-saved-card" key={card.id}>
                          <div>
                            <strong>{card.label}</strong>
                            <p>{card.brand} ending {card.last4} - expires {formatExpiry(card.expiry)}</p>
                            <small>{card.billingAddress.city || "No city saved"}</small>
                          </div>
                          <button type="button" className="cx-icon-danger" onClick={() => removeSavedCard(card.id)}>
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </article>
                      ))
                    )}
                  </div>

                  <div className="cx-card-form">
                    <h3>Add New Card</h3>
                    <p className="small">Card number and CVC can be fake, but the format must be correct. CVC is never saved.</p>
                    <div className="cx-profile-grid">
                      <div>
                        <label htmlFor="saved-card-label">Card Label</label>
                        <input
                          id="saved-card-label"
                          value={savedCardForm.label}
                          onChange={(e) => handleSavedCardFieldChange("label", e.target.value)}
                          placeholder="Personal card"
                        />
                      </div>
                      <div>
                        <label htmlFor="saved-card-name">Cardholder Name</label>
                        <input
                          id="saved-card-name"
                          value={savedCardForm.cardholderName}
                          onChange={(e) => handleSavedCardNameChange(e.target.value)}
                          placeholder="Test User"
                        />
                      </div>
                      <div>
                        <label htmlFor="saved-card-number">Card Number</label>
                        <input
                          id="saved-card-number"
                          inputMode="numeric"
                          value={savedCardForm.cardNumber}
                          onChange={(e) => handleSavedCardNumberChange(e.target.value)}
                          placeholder="4111 1111 1111 1111"
                        />
                      </div>
                      <div>
                        <label htmlFor="saved-card-expiry">Expiry Date</label>
                        <input
                          id="saved-card-expiry"
                          type="date"
                          min={minExpiryDate}
                          value={savedCardForm.expiry}
                          onChange={(e) => handleSavedCardFieldChange("expiry", e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="saved-card-cvv">CVC / CVV</label>
                        <input
                          id="saved-card-cvv"
                          inputMode="numeric"
                          maxLength={4}
                          value={savedCardForm.cvv}
                          onChange={(e) => handleSavedCardCvvChange(e.target.value)}
                          placeholder="123"
                        />
                      </div>
                    </div>
                    <button type="button" className="cx-cta cx-inline-cta" onClick={addSavedCard}>
                      Add New Card
                    </button>
                  </div>
                </section>
              </>
            )}
          </section>
        )}

        {viewMode === "orders" && (
          <section className="cx-panel">
            <div className="cx-orders-head">
              <div>
                <p className="cx-kicker">Client orders</p>
                <h2>Orders</h2>
              </div>
              <div className="cx-orders-actions">
                <span>{orderHistory.length} live</span>
                {canOrder && (
                  <button type="button" className="ghost" onClick={loadClientOrderHistory}>
                    Refresh
                  </button>
                )}
              </div>
            </div>

            {!isLoggedIn ? (
              <section className="cx-empty">
                <ReceiptText size={22} />
                <h3>Log in to view orders</h3>
                <p>Your orders will appear here after you sign in and place orders.</p>
              </section>
            ) : ordersLoading ? (
              <section className="cx-empty">
                <ReceiptText size={22} />
                <h3>Loading orders</h3>
                <p>Checking the latest statuses from cafes.</p>
              </section>
            ) : orderHistory.length === 0 ? (
              <section className="cx-empty">
                <ReceiptText size={22} />
                <h3>No orders yet</h3>
                <p>Browse active cafes, add menu items, and complete checkout to see orders here.</p>
              </section>
            ) : (
              <div className="cx-orders-list">
                {orderHistory.map((order) => (
                  <article className="cx-order-card" key={order._id}>
                    <div className="cx-order-card-head">
                      <div>
                        <strong>{order.orderNumber}</strong>
                        <p>{formatOrderDate(order.createdAt)}</p>
                        <p>{order.cafeName}</p>
                        {order.paymentMethod && <p>Paid with {order.paymentMethod}</p>}
                      </div>
                      <span className={getOrderStatusClass(order.status)}>{order.status}</span>
                    </div>

                    <div className="cx-order-items">
                      {order.items.map((item) => (
                        <div key={`${order._id}-${item.itemId}-${item.name}`}>
                          <span>{item.quantity}x {item.name}</span>
                          <strong>{(item.price * item.quantity).toFixed(2)} SAR</strong>
                        </div>
                      ))}
                    </div>

                    <div className="cx-order-delivery">
                      <strong>Delivery to {order.clientAddress?.fullName || "Client"}</strong>
                      <p>
                        {[order.clientAddress?.line1, order.clientAddress?.city, order.clientAddress?.region, order.clientAddress?.postalCode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>

                    <div className="cx-summary">
                      <div className="total">
                        <span>Total</span>
                        <strong>{order.total.toFixed(2)} SAR</strong>
                      </div>
                    </div>
                    <p className="cx-demo-note">Note: demo order only. No real payment was processed.</p>
                  </article>
                ))}
              </div>
            )}
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
          <div className="cx-payment-popup-backdrop cx-payment-notice-layer" role="presentation">
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

        {savedCardPickerOpen && (
          <div className="cx-payment-popup-backdrop cx-card-picker-layer" role="presentation">
            <section
              className="cx-payment-popup cx-saved-card-picker"
              role="dialog"
              aria-modal="true"
              aria-labelledby="saved-card-picker-title"
            >
              <h2 id="saved-card-picker-title">Choose Saved Card</h2>
              <p>Select a card to continue this order, or add a new one.</p>

              <div className="cx-saved-card-list pickable">
                {savedCards.length === 0 ? (
                  <section className="cx-empty">
                    <CreditCard size={22} />
                    <h3>No saved cards</h3>
                    <p>Add a card below to use saved-card checkout.</p>
                  </section>
                ) : (
                  savedCards.map((card) => (
                    <label
                      className={`cx-saved-card-option ${selectedSavedCardId === card.id ? "active" : ""}`}
                      key={card.id}
                    >
                      <input
                        type="radio"
                        name="saved-card"
                        checked={selectedSavedCardId === card.id}
                        onChange={() => setSelectedSavedCardId(card.id)}
                      />
                      <span>
                        <strong>{card.label}</strong>
                        <small>{card.brand} ending {card.last4} - expires {formatExpiry(card.expiry)}</small>
                      </span>
                    </label>
                  ))
                )}
              </div>

              {savedCards.length > 0 && (
                <div className="cx-saved-card-cvv">
                  <label htmlFor="saved-card-payment-cvv">CVC / CVV for selected card</label>
                  <input
                    id="saved-card-payment-cvv"
                    inputMode="numeric"
                    maxLength={4}
                    value={savedCardCvv}
                    onChange={(e) => setSavedCardCvv(getDigits(e.target.value).slice(0, 4))}
                    placeholder="123"
                  />
                  <p className="cx-payment-note">CVC is used for this demo payment only and is not saved.</p>
                </div>
              )}

              {savedCardAddOpen && (
                <div className="cx-card-form compact">
                  <h3>Add New Card</h3>
                  {accountMessage && <p className="cx-account-message">{accountMessage}</p>}
                  <div className="cx-profile-grid">
                    <div>
                      <label htmlFor="modal-card-label">Card Label</label>
                      <input
                        id="modal-card-label"
                        value={savedCardForm.label}
                        onChange={(e) => handleSavedCardFieldChange("label", e.target.value)}
                        placeholder="Personal card"
                      />
                    </div>
                    <div>
                      <label htmlFor="modal-card-name">Cardholder Name</label>
                      <input
                        id="modal-card-name"
                        value={savedCardForm.cardholderName}
                        onChange={(e) => handleSavedCardNameChange(e.target.value)}
                        placeholder="Test User"
                      />
                    </div>
                    <div>
                      <label htmlFor="modal-card-number">Card Number</label>
                      <input
                        id="modal-card-number"
                        inputMode="numeric"
                        value={savedCardForm.cardNumber}
                        onChange={(e) => handleSavedCardNumberChange(e.target.value)}
                        placeholder="4111 1111 1111 1111"
                      />
                    </div>
                    <div>
                      <label htmlFor="modal-card-expiry">Expiry Date</label>
                      <input
                        id="modal-card-expiry"
                        type="date"
                        min={minExpiryDate}
                        value={savedCardForm.expiry}
                        onChange={(e) => handleSavedCardFieldChange("expiry", e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="modal-card-cvv">CVC / CVV</label>
                      <input
                        id="modal-card-cvv"
                        inputMode="numeric"
                        maxLength={4}
                        value={savedCardForm.cvv}
                        onChange={(e) => handleSavedCardCvvChange(e.target.value)}
                        placeholder="123"
                      />
                    </div>
                  </div>
                  <button type="button" className="cx-cta" onClick={addSavedCard}>
                    Add New Card
                  </button>
                </div>
              )}

              <div className="cx-payment-actions">
                <button type="button" className="ghost" onClick={() => setSavedCardAddOpen((open) => !open)}>
                  {savedCardAddOpen ? "Hide New Card" : "Add New Card"}
                </button>
                <button type="button" className="cx-cta" onClick={payWithSavedCard} disabled={savedCards.length === 0}>
                  Pay with Selected Card
                </button>
                <button type="button" className="ghost" onClick={() => setSavedCardPickerOpen(false)}>
                  Close
                </button>
              </div>
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

            <div className="cx-saved-pay-strip">
              <div>
                <strong>Saved cards</strong>
                <p>{savedCards.length ? `${savedCards.length} card(s) available for this client.` : "No saved cards yet. You can add one now."}</p>
              </div>
              <button type="button" className="cx-cta" onClick={openSavedCardPicker}>
                Pay with Saved Card
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

              <label htmlFor="demo-card-expiry">Expiry Date</label>
              <input
                id="demo-card-expiry"
                type="date"
                min={minExpiryDate}
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
