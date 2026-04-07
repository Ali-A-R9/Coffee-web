import { useMemo, useState } from "react";
import { Clock3, Mail, MapPin, Phone, ShoppingCart, Coffee, Search, Trash2 } from "lucide-react";

type ClientMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
};

type ClientCategory = {
  name: string;
  items: ClientMenuItem[];
};

type CafeStore = {
  id: string;
  name: string;
  tagline: string;
  location: string;
  phone: string;
  email: string;
  hours: string;
  about: string;
  addressLine1: string;
  addressLine2: string;
  openingHours: Array<{ day: string; time: string }>;
  menu: ClientCategory[];
};

type CartItem = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
};

const cafes: CafeStore[] = [
  {
    id: "brew-bean",
    name: "Brew & Bean",
    tagline: "A cozy neighborhood cafe serving artisanal coffee and fresh pastries",
    location: "123 Main St, Seattle, WA",
    phone: "+1 (555) 123-4567",
    email: "owner@brewbean.com",
    hours: "8:00 AM - 6:00 PM",
    about:
      "Welcome to Brew & Bean! We're a cozy neighborhood cafe dedicated to serving the finest artisanal coffee and fresh-baked pastries. Our mission is to create a warm, inviting space where you can relax, work, or catch up with friends over a perfect cup of coffee.",
    addressLine1: "123 Main Street, Downtown",
    addressLine2: "Seattle, WA 98101",
    openingHours: [
      { day: "Monday - Friday", time: "8:00 AM - 6:00 PM" },
      { day: "Saturday", time: "9:00 AM - 5:00 PM" },
      { day: "Sunday", time: "10:00 AM - 4:00 PM" },
    ],
    menu: [
      {
        name: "Coffee",
        items: [
          { id: "espresso", name: "Espresso", description: "Rich and bold Italian coffee", price: 3.5 },
          { id: "cappuccino", name: "Cappuccino", description: "Espresso with steamed milk foam", price: 4.5 },
          { id: "latte", name: "Latte", description: "Smooth espresso with steamed milk", price: 4.75 },
          { id: "americano", name: "Americano", description: "Espresso with hot water", price: 3.75 },
        ],
      },
      {
        name: "Pastries",
        items: [
          { id: "croissant", name: "Croissant", description: "Buttery and flaky French pastry", price: 3.5 },
          { id: "muffin", name: "Muffin", description: "Fresh baked blueberry muffin", price: 3 },
          { id: "scone", name: "Scone", description: "Classic English scone with jam", price: 3.25 },
        ],
      },
    ],
  },
];

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function ClientView() {
  const [selectedCafeId, setSelectedCafeId] = useState(cafes[0].id);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState<Record<string, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  const selectedCafe = useMemo(
    () => cafes.find((cafe) => cafe.id === selectedCafeId) || cafes[0],
    [selectedCafeId]
  );

  const categoryNames = useMemo(
    () => ["All", ...selectedCafe.menu.map((category) => category.name)],
    [selectedCafe]
  );

  const filteredMenu = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return selectedCafe.menu
      .filter((category) => activeCategory === "All" || category.name === activeCategory)
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (!keyword) return true;
          return (
            item.name.toLowerCase().includes(keyword) ||
            item.description.toLowerCase().includes(keyword)
          );
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [selectedCafe, activeCategory, searchTerm]);

  const cartList = useMemo(() => Object.values(cartItems), [cartItems]);

  const cartCount = useMemo(
    () => cartList.reduce((sum, item) => sum + item.quantity, 0),
    [cartList]
  );

  const subtotal = useMemo(
    () => cartList.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartList]
  );

  const tax = useMemo(() => subtotal * 0.15, [subtotal]);
  const total = subtotal + tax;

  const totalItems = useMemo(
    () => selectedCafe.menu.reduce((sum, category) => sum + category.items.length, 0),
    [selectedCafe]
  );

  function addToCart(item: ClientMenuItem) {
    setCartItems((prev) => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: existing
          ? { ...existing, quantity: existing.quantity + 1 }
          : { itemId: item.id, name: item.name, price: item.price, quantity: 1 },
      };
    });
  }

  function increaseItem(itemId: string) {
    setCartItems((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      return { ...prev, [itemId]: { ...existing, quantity: existing.quantity + 1 } };
    });
  }

  function decreaseItem(itemId: string) {
    setCartItems((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { ...existing, quantity: existing.quantity - 1 } };
    });
  }

  function clearCart() {
    setCartItems({});
  }

  return (
    <div className="client-page">
      <header className="client-hero">
        <div className="client-hero-content">
          <div className="client-logo"><Coffee size={24} /></div>
          <div>
            <h1>{selectedCafe.name}</h1>
            <p>{selectedCafe.tagline}</p>
          </div>
          <div className="client-cafe-switch">
            <label htmlFor="cafe-switch">Cafe</label>
            <select
              id="cafe-switch"
              value={selectedCafeId}
              onChange={(e) => {
                setSelectedCafeId(e.target.value);
                setActiveCategory("All");
                setSearchTerm("");
                setCartItems({});
              }}
            >
              {cafes.map((cafe) => (
                <option key={cafe.id} value={cafe.id}>
                  {cafe.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="client-info-bar">
        <div><MapPin size={14} /> <strong>Location</strong><span>{selectedCafe.location}</span></div>
        <div><Clock3 size={14} /> <strong>Hours</strong><span>{selectedCafe.hours}</span></div>
        <div><Phone size={14} /> <strong>Phone</strong><span>{selectedCafe.phone}</span></div>
        <div><Mail size={14} /> <strong>Email</strong><span>{selectedCafe.email}</span></div>
      </div>

      <main className="client-main">
        <section className="client-card">
          <h2>About Us</h2>
          <p>{selectedCafe.about}</p>
        </section>

        <section>
          <h2 className="client-section-title">Our Menu</h2>

          <div className="client-toolbar">
            <div className="client-search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search menu items"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="client-category-tabs" role="tablist" aria-label="Category filter">
              {categoryNames.map((category) => (
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
          </div>

          {filteredMenu.map((category) => (
            <div className="client-menu-block" key={category.name}>
              <h3>{category.name}</h3>

              {category.items.map((item) => (
                <div className="client-menu-item" key={item.name}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.description}</p>
                  </div>

                  <div className="client-item-right">
                    <span>{formatPrice(item.price)}</span>
                    <button type="button" onClick={() => addToCart(item)}>
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {filteredMenu.length === 0 && (
            <div className="client-card">
              <p>No items match your search/filter yet.</p>
            </div>
          )}
        </section>

        <section className="client-cart-strip">
          <div>
            <h3>Ready to Order?</h3>
            <p>Add items to your cart and checkout</p>
          </div>
          <button type="button" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart size={14} />
            <span>View Cart ({cartCount})</span>
          </button>
        </section>

        <section className="client-card client-visit">
          <h2>Visit Us</h2>
          <div className="client-visit-grid">
            <div>
              <h4>Location</h4>
              <p>{selectedCafe.addressLine1}</p>
              <p>{selectedCafe.addressLine2}</p>
              <button type="button" className="client-outline-btn">Get Directions</button>
            </div>
            <div>
              <h4>Opening Hours</h4>
              {selectedCafe.openingHours.map((entry) => (
                <p key={entry.day}>
                  {entry.day} <span>{entry.time}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="client-map-placeholder">Map View</div>
        </section>

        <p className="small">Showing {totalItems} menu items</p>
      </main>

      <aside className={`client-cart-drawer ${isCartOpen ? "open" : ""}`} aria-hidden={!isCartOpen}>
        <div className="client-cart-head">
          <h3>Your Cart</h3>
          <button type="button" className="client-outline-btn" onClick={() => setIsCartOpen(false)}>
            Close
          </button>
        </div>

        {cartList.length === 0 ? (
          <p className="small">Your cart is empty. Add items from the menu.</p>
        ) : (
          <>
            <div className="client-cart-list">
              {cartList.map((item) => (
                <div className="client-cart-item" key={item.itemId}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{formatPrice(item.price)} each</p>
                  </div>

                  <div className="client-cart-controls">
                    <button type="button" onClick={() => decreaseItem(item.itemId)}>-</button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => increaseItem(item.itemId)}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="client-cart-summary">
              <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <div><span>Tax (15%)</span><strong>{formatPrice(tax)}</strong></div>
              <div className="total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
            </div>

            <div className="client-cart-actions">
              <button type="button" className="client-outline-btn" onClick={clearCart}>
                <Trash2 size={14} />
                <span>Clear Cart</span>
              </button>
              <button type="button" className="client-checkout-btn">
                Checkout (Frontend Demo)
              </button>
            </div>
          </>
        )}
      </aside>

      {isCartOpen && <button type="button" className="client-cart-overlay" onClick={() => setIsCartOpen(false)} aria-label="Close cart" />}
    </div>
  );
}

export default ClientView;
