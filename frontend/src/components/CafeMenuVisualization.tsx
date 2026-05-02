import { Clock3, Coffee, Globe2, Mail, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";

type CafeSocialLinks = {
  instagram?: string;
  x?: string;
  tiktok?: string;
  snapchat?: string;
  website?: string;
};

export type MenuVisualCafe = {
  name: string;
  description?: string;
  slug?: string;
  status?: string;
  hours?: string | { open?: string; close?: string };
  logoUrl?: string | null;
  contactEmail?: string;
  phone?: string;
  socialLinks?: CafeSocialLinks;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  workingHours?: Record<string, { open?: string; close?: string }>;
};

export type MenuVisualItem = {
  id?: string;
  name: string;
  price: string;
  description?: string;
  available?: boolean;
};

export type MenuVisualCategory = {
  name: string;
  items: MenuVisualItem[];
};

type CafeMenuVisualizationProps = {
  cafe: MenuVisualCafe;
  menu: MenuVisualCategory[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  context: "client" | "owner-preview";
  canOrder?: boolean;
  isLoggedIn?: boolean;
  emptyAction?: ReactNode;
  onAddItem?: (item: MenuVisualItem, itemKey: string) => void;
};

const WEEK_DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const SOCIAL_LINK_FIELDS: Array<{ key: keyof CafeSocialLinks; label: string }> = [
  { key: "instagram", label: "Instagram" },
  { key: "x", label: "X" },
  { key: "tiktok", label: "TikTok" },
  { key: "snapchat", label: "Snapchat" },
  { key: "website", label: "Website" },
];

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

function formatHours(hours: MenuVisualCafe["hours"]) {
  if (!hours) return "Hours not available";
  if (typeof hours === "string") return hours || "Hours not available";
  if (!hours.open || !hours.close) return "Hours not available";
  return `${formatShortTime(hours.open)} - ${formatShortTime(hours.close)}`;
}

function timeToMinutes(value?: string) {
  if (!value) return null;

  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function getTodayHours(cafe: MenuVisualCafe) {
  const todayKey = DAY_KEYS[new Date().getDay()];
  const weeklyHours = todayKey ? cafe.workingHours?.[todayKey] : null;

  if (weeklyHours?.open && weeklyHours?.close) return weeklyHours;
  if (cafe.hours && typeof cafe.hours !== "string") return cafe.hours;
  return null;
}

function getOpenState(cafe: MenuVisualCafe) {
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

function formatSar(price: string) {
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice)) return "SAR --";
  return `SAR ${numericPrice.toFixed(2)}`;
}

function getLocationLines(cafe: MenuVisualCafe) {
  const cityLine = [cafe.city, cafe.state, cafe.zipCode].filter(Boolean).join(", ");
  const lines = [cafe.address, cityLine].filter(Boolean);
  return lines.length ? lines : ["Location not available yet."];
}

function getDirectionsUrl(cafe: MenuVisualCafe) {
  const query = getLocationLines(cafe).join(" ");
  if (query.includes("not available")) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function getPhoneHref(phone?: string) {
  const normalized = phone?.replace(/[^\d+]/g, "") || "";
  return normalized ? `tel:${normalized}` : "";
}

function getSocialHref(key: keyof CafeSocialLinks, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmed)) {
    return `https://${trimmed.replace(/^\/+/, "")}`;
  }

  const handle = trimmed.replace(/^@/, "").replace(/^\/+/, "");
  if (!handle) return "";

  if (key === "instagram") return `https://instagram.com/${handle}`;
  if (key === "x") return `https://x.com/${handle}`;
  if (key === "tiktok") return `https://www.tiktok.com/@${handle.replace(/^@/, "")}`;
  if (key === "snapchat") return `https://www.snapchat.com/add/${handle}`;
  return `https://${handle}`;
}

function getSocialDisplay(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).hostname.replace(/^www\./, "");
    } catch {
      return trimmed;
    }
  }
  if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmed)) {
    try {
      return new URL(`https://${trimmed}`).hostname.replace(/^www\./, "");
    } catch {
      return trimmed;
    }
  }
  return trimmed.startsWith("@") ? trimmed : `@${trimmed.replace(/^\/+/, "")}`;
}

function getSocialRows(cafe: MenuVisualCafe) {
  return SOCIAL_LINK_FIELDS.map((field) => {
    const value = cafe.socialLinks?.[field.key]?.trim() || "";
    return value
      ? {
          ...field,
          value,
          href: getSocialHref(field.key, value),
          display: getSocialDisplay(value),
        }
      : null;
  }).filter(
    (row): row is {
      key: keyof CafeSocialLinks;
      label: string;
      value: string;
      href: string;
      display: string;
    } => Boolean(row)
  );
}

function getOpeningRows(cafe: MenuVisualCafe) {
  const rows = WEEK_DAYS.map((day) => {
    const dayHours = cafe.workingHours?.[day.key];
    if (!dayHours?.open || !dayHours?.close) return null;

    return {
      label: day.label,
      value: `${formatShortTime(dayHours.open)} - ${formatShortTime(dayHours.close)}`,
    };
  }).filter((row): row is { label: string; value: string } => Boolean(row));

  if (rows.length > 0) return rows;

  return [{ label: "Daily", value: formatHours(cafe.hours) }];
}

function getMenuItemCount(menu: MenuVisualCategory[]) {
  return menu.reduce((sum, category) => sum + category.items.length, 0);
}

function CafeMenuVisualization({
  cafe,
  menu,
  activeCategory,
  onCategoryChange,
  context,
  canOrder = false,
  isLoggedIn = false,
  emptyAction,
  onAddItem,
}: CafeMenuVisualizationProps) {
  const itemCount = getMenuItemCount(menu);
  const openState = getOpenState(cafe);
  const todayHours = getTodayHours(cafe);
  const todayHoursLabel = formatHours(todayHours || cafe.hours);
  const visibleMenu =
    activeCategory === "all"
      ? menu
      : menu.filter((category) => category.name === activeCategory);
  const actionCopy = context === "owner-preview" ? "Add" : canOrder ? "Add" : "Explore";
  const phoneHref = getPhoneHref(cafe.phone);
  const socialRows = getSocialRows(cafe);

  return (
    <div className="cx-menu-visual">
      <section className="cx-menu-intro cx-menu-visual-hero">
        <div className="cx-details-head">
          <div className="cx-cafe-icon cx-menu-logo" aria-hidden="true">
            {cafe.logoUrl ? <img src={cafe.logoUrl} alt="" /> : <Coffee size={20} />}
          </div>
          <div>
            <p className="cx-kicker">
              {context === "owner-preview" ? "Customer menu preview" : "Customer menu"}
            </p>
            <h2>{cafe.name}</h2>
            <p>{cafe.description || "Fresh picks from this cafe."}</p>
          </div>
        </div>

        <div className="cx-cafe-meta cx-menu-meta">
          <span>
            <MapPin size={13} /> {cafe.slug || "No public slug yet"}
          </span>
          <span>
            <Clock3 size={13} /> {todayHoursLabel}
          </span>
          <span className={openState.className}>{openState.label}</span>
          {context === "owner-preview" && cafe.status && cafe.status !== "Active" && (
            <span className="closed">Pending admin approval</span>
          )}
          <span>{menu.length} categories</span>
          <span>{itemCount} items</span>
        </div>

        <div className="cx-menu-snapshot" aria-label="Menu summary">
          <div>
            <strong>{menu.length}</strong>
            <span>Categories</span>
          </div>
          <div>
            <strong>{itemCount}</strong>
            <span>Items</span>
          </div>
          <div>
            <strong>{todayHoursLabel}</strong>
            <span>Today</span>
          </div>
        </div>
      </section>

      {context === "client" && !canOrder && (
        <section className="cx-menu-alert">
          <p>
            {isLoggedIn
              ? "You can explore this cafe menu, but only client accounts can place orders."
              : "Guests can explore this cafe menu, but ordering requires a registered client account."}
          </p>
        </section>
      )}

      <section className="cx-public-menu">
        <div className="cx-menu-title-row">
          <div>
            <p className="cx-kicker">Browse</p>
            <h2>Our Menu</h2>
          </div>
          <span>{itemCount} items</span>
        </div>

        {menu.length > 1 && (
          <div className="cx-categories cx-menu-filter" aria-label="Menu categories">
            <button
              type="button"
              className={activeCategory === "all" ? "active" : ""}
              onClick={() => onCategoryChange("all")}
            >
              All
            </button>
            {menu.map((category) => (
              <button
                key={category.name}
                type="button"
                className={activeCategory === category.name ? "active" : ""}
                onClick={() => onCategoryChange(category.name)}
              >
                {category.name}
                <small>{category.items.length}</small>
              </button>
            ))}
          </div>
        )}

        {menu.length === 0 ? (
          <section className="cx-empty owner-preview-empty">
            <Coffee size={24} />
            <h3>{context === "owner-preview" ? "No menu items yet" : "No menu yet"}</h3>
            <p>
              {context === "owner-preview"
                ? "Add categories and items from Menu Management, then return here to preview the customer menu."
                : "This cafe has not published menu items yet."}
            </p>
            {emptyAction}
          </section>
        ) : (
          <div className="cx-menu-stack">
            {visibleMenu.map((category) => (
              <section key={category.name} className="cx-menu-block owner-preview-menu-block">
                <div className="cx-menu-category-head">
                  <h3>{category.name}</h3>
                  <span>{category.items.length} items</span>
                </div>

                {category.items.length === 0 ? (
                  <p className="small cx-menu-empty-row">No items yet in this category.</p>
                ) : (
                  category.items.map((item, index) => {
                    const itemKey = item.id || `${category.name}-${item.name}-${index}`;
                    const unavailable = item.available === false;

                    return (
                      <article
                        key={itemKey}
                        className={`cx-menu-item${unavailable ? " is-unavailable" : ""}`}
                      >
                        <div className="cx-menu-item-copy">
                          <strong>{item.name}</strong>
                          <p>{item.description || `Prepared fresh by ${cafe.name}.`}</p>
                        </div>
                        <div className="cx-item-actions">
                          <span>{formatSar(item.price)}</span>
                          <button
                            type="button"
                            disabled={unavailable || context === "owner-preview"}
                            title={context === "owner-preview" ? "Preview only" : undefined}
                            onClick={() => onAddItem?.(item, itemKey)}
                          >
                            {unavailable ? "Unavailable" : actionCopy}
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="cx-visit-card">
        <h2>Visit Us</h2>
        <div className="cx-visit-grid">
          <div>
            <h3>Location</h3>
            {getLocationLines(cafe).map((line) => (
              <p key={line}>{line}</p>
            ))}
            {getDirectionsUrl(cafe) && (
              <a
                className="cx-directions"
                href={getDirectionsUrl(cafe)}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin size={13} />
                Get Directions
              </a>
            )}
          </div>
          <div>
            <h3>Contact</h3>
            <div className="cx-contact-list">
              {cafe.phone ? (
                <a href={phoneHref || undefined}>
                  <Phone size={14} />
                  <span>{cafe.phone}</span>
                </a>
              ) : (
                <p>Contact number not available yet.</p>
              )}
              {cafe.contactEmail && (
                <a href={`mailto:${cafe.contactEmail}`}>
                  <Mail size={14} />
                  <span>{cafe.contactEmail}</span>
                </a>
              )}
            </div>

            {socialRows.length > 0 && (
              <div className="cx-social-links" aria-label="Cafe social media accounts">
                {socialRows.map((social) => (
                  <a key={social.key} href={social.href} target="_blank" rel="noreferrer">
                    <Globe2 size={13} />
                    <span>{social.label}</span>
                    <strong>{social.display}</strong>
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3>Opening Hours</h3>
            <div className="cx-hours-list">
              {getOpeningRows(cafe).map((row) => (
                <div key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CafeMenuVisualization;
