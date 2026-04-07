import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Clock3,
  Coffee,
  Gift,
  Heart,
  Home,
  MapPin,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";

type TabId = "home" | "search" | "cart" | "account";
type ViewMode = "list" | "details" | "menu";
type FilterId = "open" | "high-rated" | "nearby" | "new";
type FulfillmentType = "pickup" | "delivery";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  popular?: boolean;
};

type Category = {
  name: string;
  items: MenuItem[];
};

type Cafe = {
  id: string;
  name: string;
  tagline: string;
  location: string;
  distance: number;
  rating: number;
  reviews: number;
  openNow: boolean;
  isNew?: boolean;
  etaMins: number;
  about: string;
  address: string;
  workHours: string;
  tags: string[];
  menu: Category[];
};

type CartItem = {
  key: string;
  cafeId: string;
  cafeName: string;
  itemId: string;
  name: string;
  price: number;
  quantity: number;
};

const cafes: Cafe[] = [
  {
    id: "brew-bean",
    name: "Brew & Bean",
    tagline: "Artisanal coffee and warm pastry mornings",
    location: "Downtown Seattle",
    distance: 0.3,
    rating: 4.8,
    reviews: 124,
    openNow: true,
    etaMins: 12,
    about:
      "A cozy neighborhood cafe serving artisanal coffee and fresh pastries. Great for quick pickups and relaxed afternoons.",
    address: "123 Main St, Seattle, WA",
    workHours: "8:00 AM - 6:00 PM",
    tags: ["Specialty", "Pastries", "Study Friendly"],
    menu: [
      {
        name: "Coffee",
        items: [
          { id: "espresso", name: "Espresso", description: "Rich and bold Italian coffee", price: 3.5, popular: true },
          { id: "cappuccino", name: "Cappuccino", description: "Espresso with steamed milk foam", price: 4.5 },
          { id: "latte", name: "Latte", description: "Smooth espresso with steamed milk", price: 4.75, popular: true },
          { id: "americano", name: "Americano", description: "Espresso with hot water", price: 3.75 },
        ],
      },
      {
        name: "Pastries",
        items: [
          { id: "croissant", name: "Croissant", description: "Buttery and flaky French pastry", price: 3.5, popular: true },
          { id: "muffin", name: "Muffin", description: "Fresh baked blueberry muffin", price: 3.0 },
          { id: "scone", name: "Scone", description: "Classic English scone with jam", price: 3.25 },
        ],
      },
    ],
  },
  {
    id: "daily-grind",
    name: "The Daily Grind",
    tagline: "Fresh roast, fast service, daily comfort",
    location: "Capitol Hill",
    distance: 0.5,
    rating: 4.6,
    reviews: 189,
    openNow: true,
    etaMins: 15,
    about:
      "Neighborhood favorite focused on smooth espresso, quick prep, and reliable quality throughout the day.",
    address: "52 Pine St, Seattle, WA",
    workHours: "7:00 AM - 7:00 PM",
    tags: ["Quick Service", "Breakfast", "Popular"],
    menu: [
      {
        name: "Coffee",
        items: [
          { id: "flat-white", name: "Flat White", description: "Silky milk with double ristretto", price: 4.65, popular: true },
          { id: "mocha", name: "Mocha", description: "Dark chocolate and espresso", price: 5.1 },
          { id: "drip", name: "House Drip", description: "Medium roast, all-day brew", price: 3.1 },
        ],
      },
      {
        name: "Bites",
        items: [
          { id: "bagel", name: "Sesame Bagel", description: "Toasted with cream cheese", price: 3.8 },
          { id: "cookie", name: "Chocolate Cookie", description: "Soft center, crispy edge", price: 2.9 },
        ],
      },
    ],
  },
  {
    id: "espresso-express",
    name: "Espresso Express",
    tagline: "Fast pickup and no-compromise flavor",
    location: "South Lake Union",
    distance: 0.8,
    rating: 4.7,
    reviews: 156,
    openNow: false,
    isNew: true,
    etaMins: 10,
    about: "Built for busy schedules with premium beans, reliable taste, and quick pickup windows.",
    address: "240 Fairview Ave N, Seattle, WA",
    workHours: "6:00 AM - 8:00 PM",
    tags: ["Pickup", "New", "Commuter Favorite"],
    menu: [
      {
        name: "Coffee",
        items: [
          { id: "cold-brew", name: "Cold Brew", description: "18-hour steeped concentrate", price: 4.2, popular: true },
          { id: "macchiato", name: "Macchiato", description: "Espresso with foam crown", price: 4.1 },
        ],
      },
      {
        name: "Snacks",
        items: [
          { id: "banana-bread", name: "Banana Bread", description: "Moist loaf with walnuts", price: 3.7 },
          { id: "oat-bar", name: "Oat Bar", description: "Honey oat energy bite", price: 3.2 },
        ],
      },
    ],
  },
];

const filters: Array<{ id: FilterId; label: string }> = [
  { id: "open", label: "Open Now" },
  { id: "high-rated", label: "Highly Rated" },
  { id: "nearby", label: "Nearby" },
  { id: "new", label: "New" },
];

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function ClientView() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCafeId, setSelectedCafeId] = useState<string>(cafes[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterId[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoRate, setPromoRate] = useState(0);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("pickup");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [cart, setCart] = useState<Record<string, CartItem>>({});

  const selectedCafe = useMemo(
    () => cafes.find((cafe) => cafe.id === selectedCafeId) ?? cafes[0],
    [selectedCafeId]
  );

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    setActiveCategory("All");
  }, [selectedCafeId]);

  const filteredCafes = useMemo(() => {
    const key = searchTerm.trim().toLowerCase();

    return cafes.filter((cafe) => {
      if (key) {
        const matchesKeyword =
          cafe.name.toLowerCase().includes(key) ||
          cafe.tagline.toLowerCase().includes(key) ||
          cafe.tags.some((tag) => tag.toLowerCase().includes(key));
        if (!matchesKeyword) return false;
      }

      if (activeFilters.includes("open") && !cafe.openNow) return false;
      if (activeFilters.includes("high-rated") && cafe.rating < 4.7) return false;
      if (activeFilters.includes("nearby") && cafe.distance > 0.8) return false;
      if (activeFilters.includes("new") && !cafe.isNew) return false;

      return true;
    });
  }, [searchTerm, activeFilters]);

  const categories = useMemo(
    () => ["All", ...selectedCafe.menu.map((category) => category.name)],
    [selectedCafe]
  );

  const menuItems = useMemo(() => {
    const key = searchTerm.trim().toLowerCase();

    return selectedCafe.menu
      .filter((category) => activeCategory === "All" || category.name === activeCategory)
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (!key) return true;
          return (
            item.name.toLowerCase().includes(key) ||
            item.description.toLowerCase().includes(key)
          );
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [activeCategory, searchTerm, selectedCafe]);

  const cartList = useMemo(() => Object.values(cart), [cart]);

  const groupedCart = useMemo(() => {
    return cartList.reduce<Record<string, CartItem[]>>((acc, item) => {
      if (!acc[item.cafeId]) acc[item.cafeId] = [];
      acc[item.cafeId].push(item);
      return acc;
    }, {});
  }, [cartList]);

  const cartCount = useMemo(
    () => cartList.reduce((sum, item) => sum + item.quantity, 0),
    [cartList]
  );

  const subtotal = useMemo(
    () => cartList.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartList]
  );

  const discount = useMemo(() => subtotal * promoRate, [subtotal, promoRate]);
  const tax = useMemo(() => Math.max(0, (subtotal - discount) * 0.1), [subtotal, discount]);
  const deliveryFee = fulfillment === "delivery" && subtotal > 0 ? 2.5 : 0;
  const total = Math.max(0, subtotal - discount + tax + deliveryFee);

  function showToast(message: string) {
    setToastMessage(message);
  }

  function toggleFilter(filter: FilterId) {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((id) => id !== filter) : [...prev, filter]
    );
  }

  function selectCafe(cafeId: string) {
    setSelectedCafeId(cafeId);
    setViewMode("details");
    setActiveTab("home");
  }

  function toggleFavorite(cafeId: string) {
    setFavorites((prev) => ({ ...prev, [cafeId]: !prev[cafeId] }));
  }

  function addToCart(item: MenuItem) {
    const key = `${selectedCafe.id}:${item.id}`;
    setCart((prev) => {
      const existing = prev[key];
      return {
        ...prev,
        [key]: existing
          ? { ...existing, quantity: existing.quantity + 1 }
          : {
              key,
              cafeId: selectedCafe.id,
              cafeName: selectedCafe.name,
              itemId: item.id,
              name: item.name,
              price: item.price,
              quantity: 1,
            },
      };
    });
    showToast(`${item.name} added`);
  }

  function increase(key: string) {
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return { ...prev, [key]: { ...existing, quantity: existing.quantity + 1 } };
    });
  }

  function decrease(key: string) {
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: { ...existing, quantity: existing.quantity - 1 } };
    });
  }

  function remove(key: string) {
    setCart((prev) => {
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  }

  function clearCart() {
    setCart({});
  }

  function applyPromo() {
    const code = promoCode.trim().toUpperCase();
    if (code === "BREW10") {
      setPromoRate(0.1);
      showToast("Promo applied: 10% off");
      return;
    }
    setPromoRate(0);
    showToast("Invalid promo code");
  }

  function placeOrder() {
    if (!cartList.length) {
      showToast("Add items first");
      return;
    }

    setOrderPlaced(true);
    setCart({});
    setPromoCode("");
    setPromoRate(0);
    setActiveTab("home");
    setViewMode("list");
    showToast("Order placed successfully");
  }

  function resetSearch() {
    setSearchTerm("");
    setActiveFilters([]);
  }

  return (
    <div className="cx-app">
      <header className="cx-topbar">
        <div>
          <p className="cx-topbar-sub">Client Experience</p>
          <h1>CafeSite</h1>
        </div>
        <button className="cx-notify" type="button" aria-label="Notifications">
          <Bell size={16} />
        </button>
      </header>

      {toastMessage && (
        <div className="cx-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      <main className="cx-content">
        {activeTab === "home" && viewMode === "list" && (
          <>
            <section className="cx-hero">
              <div>
                <p>Discover your next cup</p>
                <h2>Nearby Cafes</h2>
              </div>
              <button type="button" onClick={() => setActiveTab("search")}> 
                <Search size={14} /> Search
              </button>
            </section>

            {orderPlaced && (
              <section className="cx-order-status">
                <div>
                  <strong>Order confirmed</strong>
                  <p>Pickup ETA 12-15 mins. Track in Account tab.</p>
                </div>
                <button type="button" onClick={() => setOrderPlaced(false)}>
                  Dismiss
                </button>
              </section>
            )}

            <section className="cx-cafe-grid">
              {cafes.map((cafe) => (
                <article className="cx-cafe-card" key={cafe.id}>
                  <div className="cx-cafe-head">
                    <div className="cx-cafe-icon" aria-hidden="true">
                      <Coffee size={15} />
                    </div>
                    <div>
                      <h3>{cafe.name}</h3>
                      <p>{cafe.tagline}</p>
                    </div>
                    <button
                      className={`cx-heart ${favorites[cafe.id] ? "active" : ""}`}
                      type="button"
                      aria-label="Favorite cafe"
                      onClick={() => toggleFavorite(cafe.id)}
                    >
                      <Heart size={14} />
                    </button>
                  </div>

                  <div className="cx-cafe-meta">
                    <span><Star size={13} /> {cafe.rating.toFixed(1)} ({cafe.reviews})</span>
                    <span><MapPin size={13} /> {cafe.distance.toFixed(1)} mi</span>
                    <span><Clock3 size={13} /> {cafe.etaMins} min</span>
                    <span className={cafe.openNow ? "open" : "closed"}>{cafe.openNow ? "Open" : "Closed"}</span>
                  </div>

                  <div className="cx-tag-row">
                    {cafe.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>

                  <div className="cx-cafe-actions">
                    <button type="button" className="ghost" onClick={() => selectCafe(cafe.id)}>
                      Details
                    </button>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => {
                        setSelectedCafeId(cafe.id);
                        setViewMode("menu");
                      }}
                    >
                      View Menu <ChevronRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}

        {activeTab === "home" && viewMode === "details" && (
          <section className="cx-panel">
            <button type="button" className="cx-back" onClick={() => setViewMode("list")}>
              <ArrowLeft size={15} /> Cafe Details
            </button>

            <div className="cx-details-head">
              <div className="cx-cafe-icon" aria-hidden="true">
                <Coffee size={16} />
              </div>
              <div>
                <h2>{selectedCafe.name}</h2>
                <p>{selectedCafe.tagline}</p>
                <div className="cx-cafe-meta">
                  <span><Star size={13} /> {selectedCafe.rating.toFixed(1)} ({selectedCafe.reviews})</span>
                  <span><MapPin size={13} /> {selectedCafe.distance.toFixed(1)} mi away</span>
                </div>
              </div>
            </div>

            <div className="cx-details-grid">
              <article>
                <h3>Address</h3>
                <p>{selectedCafe.address}</p>
              </article>
              <article>
                <h3>Hours</h3>
                <p>{selectedCafe.workHours}</p>
              </article>
              <article>
                <h3>About</h3>
                <p>{selectedCafe.about}</p>
              </article>
            </div>

            <button
              type="button"
              className="cx-cta"
              onClick={() => {
                setViewMode("menu");
                setSearchTerm("");
              }}
            >
              View Menu
            </button>
          </section>
        )}

        {activeTab === "home" && viewMode === "menu" && (
          <>
            <section className="cx-panel">
              <button type="button" className="cx-back" onClick={() => setViewMode("details")}>
                <ArrowLeft size={15} /> Menu - {selectedCafe.name}
              </button>

              <div className="cx-searchbar">
                <Search size={15} />
                <input
                  type="search"
                  placeholder="Search menu items"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="cx-categories">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={activeCategory === category ? "active" : ""}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </section>

            {menuItems.map((category) => (
              <section key={category.name} className="cx-menu-block">
                <h3>{category.name}</h3>
                {category.items.map((item) => (
                  <article key={item.id} className="cx-menu-item">
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.description}</p>
                      {item.popular && (
                        <span className="cx-badge">
                          <Sparkles size={11} /> Popular
                        </span>
                      )}
                    </div>
                    <div className="cx-item-actions">
                      <span>{money(item.price)}</span>
                      <button type="button" onClick={() => addToCart(item)}>
                        Add to Cart
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            ))}

            {!menuItems.length && (
              <section className="cx-empty">
                <p>No menu items match your search.</p>
              </section>
            )}
          </>
        )}

        {activeTab === "search" && (
          <section className="cx-panel">
            <button type="button" className="cx-back" onClick={() => setActiveTab("home")}>
              <ArrowLeft size={15} /> Search
            </button>

            <div className="cx-searchbar">
              <Search size={15} />
              <input
                type="search"
                placeholder="Search cafes, tags, vibes"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="cx-chip-row">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={activeFilters.includes(filter.id) ? "active" : ""}
                  onClick={() => toggleFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
              <button type="button" className="clear" onClick={resetSearch}>
                Clear
              </button>
            </div>

            <div className="cx-search-results">
              {filteredCafes.map((cafe) => (
                <article className="cx-result-row" key={cafe.id}>
                  <div>
                    <h3>{cafe.name}</h3>
                    <p>{cafe.tagline}</p>
                    <div className="cx-cafe-meta">
                      <span><Star size={13} /> {cafe.rating.toFixed(1)} ({cafe.reviews})</span>
                      <span><MapPin size={13} /> {cafe.distance.toFixed(1)} mi</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCafeId(cafe.id);
                      setActiveTab("home");
                      setViewMode("details");
                    }}
                    aria-label="Open details"
                  >
                    <ChevronRight size={16} />
                  </button>
                </article>
              ))}

              {!filteredCafes.length && (
                <section className="cx-empty">
                  <p>No cafes matched your search.</p>
                </section>
              )}
            </div>
          </section>
        )}

        {activeTab === "cart" && (
          <section className="cx-panel">
            <div className="cx-cart-head">
              <h2>Cart</h2>
              {cartList.length > 0 && (
                <button type="button" className="cx-clear-btn" onClick={clearCart}>
                  <Trash2 size={13} /> Clear
                </button>
              )}
            </div>

            <div className="cx-fulfillment">
              <button
                type="button"
                className={fulfillment === "pickup" ? "active" : ""}
                onClick={() => setFulfillment("pickup")}
              >
                Pickup
              </button>
              <button
                type="button"
                className={fulfillment === "delivery" ? "active" : ""}
                onClick={() => setFulfillment("delivery")}
              >
                Delivery
              </button>
            </div>

            {!cartList.length && (
              <section className="cx-empty">
                <p>Your cart is empty.</p>
              </section>
            )}

            {Object.entries(groupedCart).map(([cafeId, items]) => (
              <section className="cx-cart-group" key={cafeId}>
                <p className="from">FROM</p>
                <h3>{items[0].cafeName}</h3>

                {items.map((item) => (
                  <article className="cx-cart-item" key={item.key}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{money(item.price)}</p>
                    </div>

                    <div className="cx-qty-controls">
                      <button type="button" onClick={() => decrease(item.key)} aria-label="Decrease quantity">
                        <Minus size={13} />
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => increase(item.key)} aria-label="Increase quantity">
                        <Plus size={13} />
                      </button>
                      <button type="button" className="delete" onClick={() => remove(item.key)} aria-label="Delete item">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            ))}

            {cartList.length > 0 && (
              <>
                <section className="cx-promo">
                  <h4>
                    <Gift size={14} /> Promo
                  </h4>
                  <div>
                    <input
                      type="text"
                      placeholder="Try BREW10"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <button type="button" onClick={applyPromo}>Apply</button>
                  </div>
                </section>

                <section className="cx-summary">
                  <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                  <div><span>Discount</span><strong>-{money(discount)}</strong></div>
                  <div><span>Tax</span><strong>{money(tax)}</strong></div>
                  <div><span>{fulfillment === "delivery" ? "Delivery" : "Pickup"}</span><strong>{money(deliveryFee)}</strong></div>
                  <div className="total"><span>Total</span><strong>{money(total)}</strong></div>
                </section>

                <button type="button" className="cx-cta" onClick={placeOrder}>
                  Place Order
                </button>
              </>
            )}
          </section>
        )}

        {activeTab === "account" && (
          <section className="cx-panel">
            <div className="cx-account">
              <div className="avatar"><UserRound size={18} /></div>
              <div>
                <h3>Client Account</h3>
                <p>samira.client@example.com</p>
              </div>
            </div>

            <section className="cx-account-card">
              <h4>Quick Actions</h4>
              <button type="button">Saved Addresses</button>
              <button type="button">Payment Methods</button>
              <button type="button">Order History</button>
            </section>

            <section className="cx-account-card">
              <h4>Order Tracking Demo</h4>
              <div className="cx-track">
                <span className="active">Placed</span>
                <span className="active">Preparing</span>
                <span>Ready</span>
                <span>Picked Up</span>
              </div>
            </section>
          </section>
        )}
      </main>

      <nav className="cx-nav" aria-label="Client navigation">
        <button type="button" className={activeTab === "home" ? "active" : ""} onClick={() => { setActiveTab("home"); setViewMode("list"); }}>
          <Home size={16} />
          <span>Home</span>
        </button>
        <button type="button" className={activeTab === "search" ? "active" : ""} onClick={() => setActiveTab("search")}>
          <Search size={16} />
          <span>Search</span>
        </button>
        <button type="button" className={activeTab === "cart" ? "active" : ""} onClick={() => setActiveTab("cart")}>
          <ShoppingCart size={16} />
          <span>Cart {cartCount > 0 ? `(${cartCount})` : ""}</span>
        </button>
        <button type="button" className={activeTab === "account" ? "active" : ""} onClick={() => setActiveTab("account")}>
          <UserRound size={16} />
          <span>Account</span>
        </button>
      </nav>
    </div>
  );
}

export default ClientView;
