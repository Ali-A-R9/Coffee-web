import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ban,
  CheckCircle2,
  Clock3,
  Coffee,
  Eye,
  Home,
  List,
  LogOut,
  Menu,
  Moon,
  Palette,
  Plus,
  QrCode,
  ReceiptText,
  Sun,
  Truck,
  Upload,
  User,
} from "lucide-react";

import { getCurrentUser, logout } from "../api/authApi";
import {
  createCafe,
  getMyCafe,
  updateCafe,
  type CafeData,
  type CafeSocialLinks,
} from "../api/cafeApi";
import { getMenu, saveMenu } from "../api/menuApi";
import {
  getOwnerOrders,
  updateOwnerOrderStatus,
  type CafeOrder,
  type OrderStatus,
} from "../api/orderApi";
import { useUiTheme } from "../hooks/useUiTheme";
import type { Category } from "../types/menu";

type OwnerSection = "dashboard" | "profile" | "menu" | "orders" | "theme" | "qr";
type OwnerOrderFilter = "all" | OrderStatus;
type OwnerOrderSort = "recent" | "oldest" | "az" | "status";
type OwnerOrderPeriod = "all" | "today" | "month";

type WorkingHours = {
  open: string;
  close: string;
};

type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type WeeklyHours = Record<Weekday, WorkingHours>;

const EMPTY_HOURS: WorkingHours = {
  open: "",
  close: "",
};

const DEFAULT_HOURS: WorkingHours = {
  open: "08:00",
  close: "18:00",
};

const WEEK_DAYS: Array<{ key: Weekday; label: string }> = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const ORDER_STATUS_OPTIONS: OrderStatus[] = ["Placed", "On the way", "Delivered", "Cancelled"];
const ORDER_STATUS_RANK: Record<OrderStatus, number> = {
  Placed: 1,
  "On the way": 2,
  Delivered: 3,
  Cancelled: 4,
};
const SOCIAL_LINK_FIELDS: Array<{
  key: keyof CafeSocialLinks;
  label: string;
  placeholder: string;
}> = [
  { key: "instagram", label: "Instagram", placeholder: "@yourcafe or instagram.com/yourcafe" },
  { key: "x", label: "X / Twitter", placeholder: "@yourcafe or x.com/yourcafe" },
  { key: "tiktok", label: "TikTok", placeholder: "@yourcafe or tiktok.com/@yourcafe" },
  { key: "snapchat", label: "Snapchat", placeholder: "@yourcafe or snapchat.com/add/yourcafe" },
  { key: "website", label: "Website", placeholder: "https://yourcafe.com" },
];
const EMPTY_SOCIAL_LINKS: Required<CafeSocialLinks> = {
  instagram: "",
  x: "",
  tiktok: "",
  snapchat: "",
  website: "",
};

function buildWeeklyHours(baseHours: WorkingHours = DEFAULT_HOURS): WeeklyHours {
  return WEEK_DAYS.reduce((result, day) => {
    result[day.key] = {
      open: baseHours.open,
      close: baseHours.close,
    };
    return result;
  }, {} as WeeklyHours);
}

function getHoursFromCafe(hours: CafeData["hours"]): WorkingHours {
  if (!hours || typeof hours === "string") {
    return EMPTY_HOURS;
  }

  return {
    open: hours.open || "",
    close: hours.close || "",
  };
}

function getWeeklyHoursFromCafe(cafe: CafeData | null): WeeklyHours {
  const baseHours = getHoursFromCafe(cafe?.hours);
  const fallback =
    baseHours.open || baseHours.close
      ? baseHours
      : DEFAULT_HOURS;
  const source = cafe?.workingHours || {};

  return WEEK_DAYS.reduce((result, day) => {
    const dayHours = source[day.key];
    result[day.key] = {
      open: dayHours?.open || fallback.open,
      close: dayHours?.close || fallback.close,
    };
    return result;
  }, {} as WeeklyHours);
}

function formatTimestamp(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString();
}

function formatOrderTotal(value: number) {
  return `${value.toFixed(2)} SAR`;
}

function normalizeSocialLinks(socialLinks?: CafeSocialLinks): Required<CafeSocialLinks> {
  return {
    instagram: socialLinks?.instagram || "",
    x: socialLinks?.x || "",
    tiktok: socialLinks?.tiktok || "",
    snapchat: socialLinks?.snapchat || "",
    website: socialLinks?.website || "",
  };
}

function trimSocialLinks(socialLinks: CafeSocialLinks): Required<CafeSocialLinks> {
  return {
    instagram: socialLinks.instagram?.trim() || "",
    x: socialLinks.x?.trim() || "",
    tiktok: socialLinks.tiktok?.trim() || "",
    snapchat: socialLinks.snapchat?.trim() || "",
    website: socialLinks.website?.trim() || "",
  };
}

function isValidContactPhone(value: string) {
  return /^\+?[0-9][0-9\s().-]{6,19}$/.test(value.trim());
}

function hasCompleteLocation(address: string, city: string, state: string, zipCode: string) {
  return Boolean(address.trim() && city.trim() && state.trim() && zipCode.trim());
}

function getOwnerOrderStatusClass(status: OrderStatus) {
  return `owner-order-status ${status.toLowerCase().replace(/\s+/g, "-")}`;
}

function formatOrderAddress(order: CafeOrder) {
  return [
    order.clientAddress?.line1,
    order.clientAddress?.city,
    order.clientAddress?.region,
    order.clientAddress?.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function isSameDay(value: string) {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isSameMonth(value: string) {
  const date = new Date(value);
  const today = new Date();

  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
}

function buildPublicUrl(cafe: CafeData | null, name: string) {
  const slug =
    cafe?.slug ||
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

  return slug ? `/cafe/${slug}` : "Unavailable";
}

function buildAbsoluteCafeUrl(publicPath: string) {
  if (publicPath === "Unavailable") return "";

  const origin =
    typeof window === "undefined" ? "http://localhost:5173" : window.location.origin;

  return `${origin}${publicPath}`;
}

function buildQrImageUrl(targetUrl: string) {
  if (!targetUrl) return "";

  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=14&data=${encodeURIComponent(
    targetUrl
  )}`;
}

function OwnerDashboard() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useUiTheme("owner-dashboard-theme");
  const currentUser = getCurrentUser();
  const currentUserEmail = currentUser?.email || "";
  const currentUserFullName = currentUser?.fullName || "";
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [cafe, setCafe] = useState<CafeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [menuData, setMenuData] = useState<Category[]>([]);
  const [activeSection, setActiveSection] = useState<OwnerSection>("dashboard");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [socialLinks, setSocialLinks] =
    useState<Required<CafeSocialLinks>>(EMPTY_SOCIAL_LINKS);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [hours, setHours] = useState<WorkingHours>(EMPTY_HOURS);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>(() => buildWeeklyHours());
  const [profileMessage, setProfileMessage] = useState("");
  const [profileMessageType, setProfileMessageType] = useState<"success" | "error" | "">("");
  const [ownerToast, setOwnerToast] = useState("");
  const [menuMessage, setMenuMessage] = useState("");
  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersMessage, setOrdersMessage] = useState("");
  const [orderFilter, setOrderFilter] = useState<OwnerOrderFilter>("all");
  const [orderPeriod, setOrderPeriod] = useState<OwnerOrderPeriod>("all");
  const [orderSort, setOrderSort] = useState<OwnerOrderSort>("recent");
  const [selectedOrder, setSelectedOrder] = useState<CafeOrder | null>(null);

  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createMessage, setCreateMessage] = useState("");

  const [newCategory, setNewCategory] = useState("");
  const [newItemCategory, setNewItemCategory] = useState(0);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingItem, setEditingItem] = useState<{
    categoryIndex: number;
    itemIndex: number;
  } | null>(null);
  const [editingItemName, setEditingItemName] = useState("");
  const [editingItemPrice, setEditingItemPrice] = useState("");

  const status = cafe?.status || "Pending";
  const statusClass =
    status === "Active"
      ? "owner-pill-live"
      : status === "Declined"
      ? "owner-pill-declined"
      : "owner-pill-pending";
  const menuItemsCount = menuData.reduce((total, category) => total + category.items.length, 0);
  const publicUrl = useMemo(() => buildPublicUrl(cafe, name), [cafe, name]);
  const qrTargetUrl = useMemo(() => buildAbsoluteCafeUrl(publicUrl), [publicUrl]);
  const qrImageUrl = useMemo(() => buildQrImageUrl(qrTargetUrl), [qrTargetUrl]);
  const profileReady = Boolean(
    name.trim() &&
      description.trim() &&
      contactEmail.trim() &&
      isValidContactPhone(phone) &&
      hasCompleteLocation(address, city, stateRegion, zipCode)
  );
  const hoursReady = WEEK_DAYS.some((day) => {
    const dayHours = weeklyHours[day.key];
    return dayHours.open && dayHours.close;
  });
  const menuReady = menuData.length > 0 && menuItemsCount > 0;
  const qrReady = publicUrl !== "Unavailable";
  const readinessItems = [
    { label: "Profile details", done: profileReady },
    { label: "Working hours", done: hoursReady },
    { label: "Menu items", done: menuReady },
    { label: "QR/public link", done: qrReady },
    { label: "Admin approval", done: status === "Active" },
  ];
  const readinessCount = readinessItems.filter((item) => item.done).length;
  const ownerLayoutClass = `owner-layout ${isDark ? "owner-dark" : ""}`;
  const orderCounts = useMemo(() => {
    return {
      all: orders.length,
      placed: orders.filter((order) => order.status === "Placed").length,
      onTheWay: orders.filter((order) => order.status === "On the way").length,
      delivered: orders.filter((order) => order.status === "Delivered").length,
      cancelled: orders.filter((order) => order.status === "Cancelled").length,
      today: orders.filter((order) => isSameDay(order.createdAt)).length,
      month: orders.filter((order) => isSameMonth(order.createdAt)).length,
    };
  }, [orders]);
  const visibleOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const matchesStatus = orderFilter === "all" || order.status === orderFilter;
      const matchesPeriod =
        orderPeriod === "all" ||
        (orderPeriod === "today" && isSameDay(order.createdAt)) ||
        (orderPeriod === "month" && isSameMonth(order.createdAt));

      return matchesStatus && matchesPeriod;
    });

    return [...filtered].sort((a, b) => {
      if (orderSort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      if (orderSort === "az") {
        return a.clientName.localeCompare(b.clientName);
      }

      if (orderSort === "status") {
        return ORDER_STATUS_RANK[a.status] - ORDER_STATUS_RANK[b.status];
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orderFilter, orderPeriod, orderSort, orders]);

  const syncCafeState = useCallback((data: CafeData | null) => {
    setCafe(data);

    if (!data) {
      setName("");
      setDescription("");
      setOwnerName(currentUserFullName);
      setContactEmail(currentUserEmail);
      setPhone("");
      setSocialLinks(EMPTY_SOCIAL_LINKS);
      setAddress("");
      setCity("");
      setStateRegion("");
      setZipCode("");
      setLogoUrl("");
      setHours(DEFAULT_HOURS);
      setWeeklyHours(buildWeeklyHours(DEFAULT_HOURS));
      return;
    }

    const nextWeeklyHours = getWeeklyHoursFromCafe(data);
    const nextHours = getHoursFromCafe(data.hours);

    setName(data.name || "");
    setDescription(data.description || "");
    setOwnerName(data.ownerName || currentUserFullName);
    setContactEmail(data.contactEmail || currentUserEmail);
    setPhone(data.phone || "");
    setSocialLinks(normalizeSocialLinks(data.socialLinks));
    setAddress(data.address || "");
    setCity(data.city || "");
    setStateRegion(data.state || "");
    setZipCode(data.zipCode || "");
    setLogoUrl(data.logoUrl || "");
    setHours(nextHours.open || nextHours.close ? nextHours : nextWeeklyHours.monday);
    setWeeklyHours(nextWeeklyHours);
  }, [currentUserEmail, currentUserFullName]);

  const loadOwnerOrders = useCallback(async (cafeId = "") => {
    try {
      setOrdersLoading(true);
      setOrdersMessage("");
      const data = await getOwnerOrders(cafeId);
      setOrders(data);
    } catch (error) {
      setOrdersMessage(error instanceof Error ? error.message : "Failed to load orders.");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const loadCafeData = useCallback(async () => {
    try {
      setLoadError("");
      const data = await getMyCafe();
      syncCafeState(data);
      loadOwnerOrders(data?._id);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load cafe");
      syncCafeState(null);
      loadOwnerOrders("");
    } finally {
      setLoading(false);
    }
  }, [loadOwnerOrders, syncCafeState]);

  const loadMenuData = useCallback(async () => {
    try {
      const data = await getMenu();
      setMenuData(Array.isArray(data) ? data : []);
    } catch {
      setMenuData([]);
    }
  }, []);

  useEffect(() => {
    loadCafeData();
    loadMenuData();
  }, [loadCafeData, loadMenuData]);

  useEffect(() => {
    if (newItemCategory >= menuData.length && menuData.length > 0) {
      setNewItemCategory(0);
    }
  }, [menuData, newItemCategory]);

  useEffect(() => {
    if (!ownerToast) return;

    const timer = window.setTimeout(() => {
      setOwnerToast("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [ownerToast]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function changeOrderStatus(order: CafeOrder, status: OrderStatus) {
    try {
      const updatedOrder = await updateOwnerOrderStatus(order._id, status);
      setOrders((prev) =>
        prev.map((item) => (item._id === updatedOrder._id ? updatedOrder : item))
      );
      setSelectedOrder((current) =>
        current?._id === updatedOrder._id ? updatedOrder : current
      );
      setOrdersMessage(`Order ${updatedOrder.orderNumber} updated to ${updatedOrder.status}.`);
      setOwnerToast(`Order ${updatedOrder.orderNumber} is now ${updatedOrder.status}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update order status.";
      setOrdersMessage(message);
      setOwnerToast(message);
    }
  }

  async function handleCreateCafe() {
    const trimmedName = createName.trim();

    if (!trimmedName) {
      setCreateMessage("Cafe name is required.");
      return;
    }

    try {
      const res = await createCafe({
        name: trimmedName,
        description: createDescription.trim(),
      });

      syncCafeState(res.cafe);
      loadOwnerOrders(res.cafe?._id);
      setCreateMessage("Cafe created successfully.");
      setCreateName("");
      setCreateDescription("");
    } catch (error) {
      setCreateMessage(
        error instanceof Error ? error.message : "Failed to create cafe"
      );
    }
  }

  async function saveProfile() {
    if (!name.trim()) {
      const message = "Cafe name is required.";
      setProfileMessage(message);
      setProfileMessageType("error");
      setOwnerToast(message);
      return;
    }

    if (!isValidContactPhone(phone)) {
      const message =
        "Contact phone number is required. Use digits and an optional country code, like +966 5x xxx xxxx.";
      setProfileMessage(message);
      setProfileMessageType("error");
      setOwnerToast(message);
      return;
    }

    if (!hasCompleteLocation(address, city, stateRegion, zipCode)) {
      const message =
        "Cafe location is required. Add address, city, state/region, and zip code so customers can find you.";
      setProfileMessage(message);
      setProfileMessageType("error");
      setOwnerToast(message);
      return;
    }

    try {
      const trimmedSocialLinks = trimSocialLinks(socialLinks);
      const res = await updateCafe({
        name: name.trim(),
        description: description.trim(),
        ownerName: ownerName.trim(),
        contactEmail: contactEmail.trim(),
        phone: phone.trim(),
        socialLinks: trimmedSocialLinks,
        address: address.trim(),
        city: city.trim(),
        state: stateRegion.trim(),
        zipCode: zipCode.trim(),
        logoUrl: logoUrl.trim(),
        hours: {
          open: hours.open.trim(),
          close: hours.close.trim(),
        },
        workingHours: weeklyHours,
      });

      syncCafeState(res.cafe);
      setProfileMessage("Profile updated successfully.");
      setProfileMessageType("success");
      setOwnerToast("Profile saved successfully.");
    } catch (error) {
      setProfileMessage(
        error instanceof Error ? error.message : "Failed to update profile"
      );
      setProfileMessageType("error");
      setOwnerToast("");
    }
  }

  function updateSocialLink(field: keyof CafeSocialLinks, value: string) {
    setSocialLinks((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateWeeklyHours(day: Weekday, field: keyof WorkingHours, value: string) {
    setWeeklyHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));

    if (day === "monday") {
      setHours((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  }

  function applyMondayHoursToAll() {
    const mondayHours = weeklyHours.monday;
    setWeeklyHours(buildWeeklyHours(mondayHours));
    setHours(mondayHours);
    setProfileMessage("Monday hours copied to the full week. Click Save Profile to publish.");
    setProfileMessageType("success");
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setProfileMessage("Please upload a JPG, PNG, or WebP image.");
      setProfileMessageType("error");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage("Logo image must be 2MB or smaller.");
      setProfileMessageType("error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result);
        setProfileMessage("Logo attached. Click Save Profile to publish it.");
        setProfileMessageType("success");
      }
    };
    reader.onerror = () => {
      setProfileMessage("Could not read this logo file. Please try another image.");
      setProfileMessageType("error");
    };
    reader.readAsDataURL(file);
  }

  function showMenuError(message: string) {
    setMenuMessage(message);
    setOwnerToast(message);
  }

  async function persistMenu(updated: Category[], successMessage = "Menu saved successfully.") {
    try {
      await saveMenu(updated);
      setMenuData(updated);
      setMenuMessage(successMessage);
      setOwnerToast(successMessage);
    } catch (error) {
      showMenuError(error instanceof Error ? error.message : "Failed to save menu");

      try {
        const freshData = await getMenu();
        setMenuData(Array.isArray(freshData) ? freshData : []);
      } catch {
        // ignore refresh failure
      }
    }
  }

  function addCategory() {
    const trimmedCategory = newCategory.trim();

    if (!trimmedCategory) {
      showMenuError("Category name is required.");
      return;
    }

    const exists = menuData.some(
      (category) => category.name.toLowerCase() === trimmedCategory.toLowerCase()
    );

    if (exists) {
      showMenuError(`Duplicate category name: "${trimmedCategory}".`);
      return;
    }

    const updated: Category[] = [
      ...menuData,
      { name: trimmedCategory, visible: true, items: [] },
    ];

    setMenuMessage("");
    persistMenu(updated, "Category added successfully.");
    setNewCategory("");
  }

  function addItem() {
    const trimmedName = newItemName.trim();
    const trimmedPrice = newItemPrice.trim();

    if (!trimmedName) {
      showMenuError("Item name is required.");
      return;
    }

    if (!trimmedPrice) {
      showMenuError("Item price is required.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(trimmedPrice)) {
      showMenuError("Price in SAR must be a valid number like 10 or 10.50.");
      return;
    }

    if (menuData.length === 0) {
      showMenuError("Please add a category first.");
      return;
    }

    const category = menuData[newItemCategory];
    if (!category) {
      showMenuError("Please select a valid category.");
      return;
    }

    const duplicateItem = category.items.some(
      (item) => item.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicateItem) {
      showMenuError(`Duplicate item name "${trimmedName}" in category "${category.name}".`);
      return;
    }

    const updated: Category[] = menuData.map((cat, index) => {
      if (index !== newItemCategory) return cat;

      return {
        ...cat,
        items: [...cat.items, { name: trimmedName, price: trimmedPrice, visible: true }],
      };
    });

    setMenuMessage("");
    persistMenu(updated, "Item added successfully.");
    setNewItemName("");
    setNewItemPrice("");
  }

  function removeItem(categoryIndex: number, itemIndex: number) {
    const item = menuData[categoryIndex]?.items[itemIndex];
    if (!item) return;

    if (!window.confirm(`Delete "${item.name}" from your menu?`)) {
      return;
    }

    const updated: Category[] = menuData.map((category, index) => {
      if (index !== categoryIndex) return category;

      return {
        ...category,
        items: category.items.filter((_, i) => i !== itemIndex),
      };
    });

    setMenuMessage("");
    persistMenu(updated, "Item deleted successfully.");
  }

  function toggleCategoryVisibility(categoryIndex: number) {
    const category = menuData[categoryIndex];
    if (!category) return;

    const willBeVisible = category.visible === false;
    const updated: Category[] = menuData.map((cat, index) => {
      if (index !== categoryIndex) return cat;

      return {
        ...cat,
        visible: willBeVisible,
      };
    });

    setMenuMessage("");
    persistMenu(
      updated,
      `${category.name} is now ${
        willBeVisible ? "shown to clients" : "hidden from clients"
      } successfully.`
    );
  }

  function toggleItemVisibility(categoryIndex: number, itemIndex: number) {
    const item = menuData[categoryIndex]?.items[itemIndex];
    if (!item) return;

    const willBeVisible = item.visible === false;
    const updated: Category[] = menuData.map((category, index) => {
      if (index !== categoryIndex) return category;

      return {
        ...category,
        items: category.items.map((menuItem, menuItemIndex) => {
          if (menuItemIndex !== itemIndex) return menuItem;

          return {
            ...menuItem,
            visible: willBeVisible,
          };
        }),
      };
    });

    setMenuMessage("");
    persistMenu(
      updated,
      `${item.name} is now ${
        willBeVisible ? "shown to clients" : "hidden from clients"
      } successfully.`
    );
  }

  function removeCategory(categoryIndex: number) {
    const category = menuData[categoryIndex];
    if (!category) return;

    if (
      !window.confirm(
        `Delete category "${category.name}" and ${category.items.length} menu items?`
      )
    ) {
      return;
    }

    const updated: Category[] = menuData.filter((_, index) => index !== categoryIndex);

    setMenuMessage("");
    persistMenu(updated, "Category deleted successfully.");

    if (newItemCategory >= updated.length) {
      setNewItemCategory(Math.max(0, updated.length - 1));
    }

    if (editingCategoryIndex === categoryIndex) {
      cancelEditCategory();
    }
  }

  function startEditCategory(categoryIndex: number) {
    setEditingCategoryIndex(categoryIndex);
    setEditingCategoryName(menuData[categoryIndex].name);
  }

  function cancelEditCategory() {
    setEditingCategoryIndex(null);
    setEditingCategoryName("");
  }

  function saveEditedCategory() {
    if (editingCategoryIndex === null) return;

    const trimmedName = editingCategoryName.trim();

    if (!trimmedName) {
      showMenuError("Category name is required.");
      return;
    }

    const exists = menuData.some(
      (category, index) =>
        index !== editingCategoryIndex &&
        category.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
      showMenuError(`Duplicate category name: "${trimmedName}".`);
      return;
    }

    const updated: Category[] = menuData.map((category, index) => {
      if (index !== editingCategoryIndex) return category;

      return {
        ...category,
        name: trimmedName,
      };
    });

    setMenuMessage("");
    persistMenu(updated, "Category updated successfully.");
    cancelEditCategory();
  }

  function startEditItem(categoryIndex: number, itemIndex: number) {
    const item = menuData[categoryIndex].items[itemIndex];
    setEditingItem({ categoryIndex, itemIndex });
    setEditingItemName(item.name);
    setEditingItemPrice(item.price);
  }

  function cancelEditItem() {
    setEditingItem(null);
    setEditingItemName("");
    setEditingItemPrice("");
  }

  function saveEditedItem() {
    if (!editingItem) return;

    const trimmedName = editingItemName.trim();
    const trimmedPrice = editingItemPrice.trim();

    if (!trimmedName) {
      showMenuError("Item name is required.");
      return;
    }

    if (!trimmedPrice) {
      showMenuError("Item price is required.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(trimmedPrice)) {
      showMenuError("Price in SAR must be a valid number like 10 or 10.50.");
      return;
    }

    const category = menuData[editingItem.categoryIndex];
    if (!category) return;

    const exists = category.items.some(
      (item, index) =>
        index !== editingItem.itemIndex &&
        item.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
      showMenuError(`Duplicate item name "${trimmedName}" in category "${category.name}".`);
      return;
    }

    const updated: Category[] = menuData.map((cat, catIndex) => {
      if (catIndex !== editingItem.categoryIndex) return cat;

      return {
        ...cat,
        items: cat.items.map((item, itemIndex) => {
          if (itemIndex !== editingItem.itemIndex) return item;

          return {
            ...item,
            name: trimmedName,
            price: trimmedPrice,
          };
        }),
      };
    });

    setMenuMessage("");
    persistMenu(updated, "Item updated successfully.");
    cancelEditItem();
  }

  const navItems: Array<{ key: OwnerSection; label: string; icon: ReactNode }> = [
    { key: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
    { key: "profile", label: "Cafe Profile", icon: <User size={18} /> },
    { key: "menu", label: "Menu Management", icon: <Menu size={18} /> },
    { key: "orders", label: "Orders", icon: <ReceiptText size={18} /> },
    { key: "theme", label: "Theme Selection", icon: <Palette size={18} /> },
    { key: "qr", label: "QR Code", icon: <QrCode size={18} /> },
  ];

  if (loading) {
    return (
      <div className={ownerLayoutClass}>
        <main className="owner-main">
          <section className="owner-panel">
            <h2>Loading owner dashboard...</h2>
          </section>
        </main>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className={ownerLayoutClass}>
        <aside className="owner-sidebar">
          <div>
            <div className="owner-brand">
              <span className="owner-brand-icon">
                <Coffee size={14} />
              </span>
              <strong>CafeSite</strong>
            </div>
            <p className="owner-sidebar-title">CAFE MANAGEMENT</p>
            <button
              type="button"
              className="owner-mode-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch owner dashboard to light mode" : "Switch owner dashboard to dark mode"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>

          <div className="owner-sidebar-footer">
            <button type="button" className="owner-logout" onClick={handleLogout}>
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="owner-main">
          <section>
            <h1 className="owner-title">Create Your Cafe</h1>
            <p className="owner-subtitle">
              Start with real data that will be saved in the `cafes` collection.
            </p>

            <div className="owner-panel">
              <h2>New Cafe</h2>
              <div className="owner-form-grid">
                <div>
                  <label htmlFor="create-cafe-name">Cafe Name</label>
                  <input
                    id="create-cafe-name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Enter your cafe name"
                  />
                </div>

                <div className="full">
                  <label htmlFor="create-cafe-description">Description</label>
                  <textarea
                    id="create-cafe-description"
                    rows={4}
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Describe your cafe"
                  />
                </div>
              </div>

              <button type="button" className="owner-primary" onClick={handleCreateCafe}>
                Create Cafe
              </button>

              <p className={createMessage ? "success" : "small"}>
                {createMessage || loadError || " "}
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={ownerLayoutClass}>
      <aside className="owner-sidebar">
        <div>
          <div className="owner-brand">
            <span className="owner-brand-icon">
              <Coffee size={14} />
            </span>
            <strong>CafeSite</strong>
          </div>
          <p className="owner-sidebar-title">CAFE MANAGEMENT</p>

          <div className="owner-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`owner-nav-item ${activeSection === item.key ? "active" : ""}`}
                onClick={() => setActiveSection(item.key)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="owner-mode-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch owner dashboard to light mode" : "Switch owner dashboard to dark mode"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>

        <div className="owner-sidebar-footer">
          <div className="owner-user-pill">
            <strong>{name || "Unnamed cafe"}</strong>
            <span>{status}</span>
          </div>
          <button type="button" className="owner-logout" onClick={handleLogout}>
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="owner-main">
        {ownerToast && (
          <div className="owner-toast" role="status" aria-live="polite">
            {ownerToast}
          </div>
        )}

        {activeSection === "dashboard" && (
          <section>
            <h1 className="owner-title">{name}</h1>
            <p className="owner-subtitle">Your dashboard is now driven by live database data.</p>

            <div className="owner-status-row">
              <span className={`owner-pill ${statusClass}`}>
                {status}
              </span>
            </div>

            {status === "Pending" && (
              <div className="owner-alert">
                <strong>Account Pending Approval</strong>
                <p>Your cafe is currently under review by the admin. Approval will update this same cafe document.</p>
              </div>
            )}

            {status === "Declined" && (
              <div className="owner-alert owner-alert-declined">
                <strong>Your cafe was declined</strong>
                <p>
                  {cafe.adminComment ||
                    "The admin did not leave a comment. Please update your cafe details and contact the admin."}
                </p>
              </div>
            )}

            <div className="owner-stats">
              <div className="owner-stat-card">
                <List size={20} />
                <strong>{menuData.length}</strong>
                <span>Categories</span>
              </div>
              <div className="owner-stat-card">
                <Menu size={20} />
                <strong>{menuItemsCount}</strong>
                <span>Menu Items</span>
              </div>
              <div className="owner-stat-card">
                <ReceiptText size={20} />
                <strong>{orderCounts.all}</strong>
                <span>Orders</span>
              </div>
              <div className="owner-stat-card">
                <Eye size={20} />
                <strong>{formatTimestamp(cafe.updatedAt)}</strong>
                <span>Last Updated</span>
              </div>
            </div>

            <div className="owner-panel owner-readiness-panel">
              <div className="owner-panel-heading">
                <div>
                  <h2>Publishing Readiness</h2>
                  <p>Use this checklist before sharing your public menu with customers.</p>
                </div>
                <span className="owner-count-pill">
                  {readinessCount}/{readinessItems.length} ready
                </span>
              </div>

              <div className="owner-readiness-list">
                {readinessItems.map((item) => (
                  <div className={item.done ? "ready" : ""} key={item.label}>
                    <span>{item.done ? "Ready" : "Needs work"}</span>
                    <strong>{item.label}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="owner-panel">
              <h2>Cafe Summary</h2>
              <p className="owner-subtitle">
                <strong>Slug:</strong> {cafe.slug || "Not available"}
              </p>
              <p className="owner-subtitle">
                <strong>Description:</strong> {description || "No description yet."}
              </p>
              <p className="owner-subtitle">
                <strong>Hours:</strong>{" "}
                {hours.open && hours.close ? `${hours.open} - ${hours.close}` : "Not set"}
              </p>
            </div>

            <div className="owner-panel">
              <h2>Your Public Website</h2>
              <div className="owner-site-row">
                <div>
                  <strong>{name}</strong>
                  <p>{publicUrl}</p>
                </div>
                <button type="button" className="owner-secondary" onClick={() => navigate("/preview")}>
                  <Eye size={14} />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {activeSection === "profile" && (
          <section>
            <h1 className="owner-title">Cafe Profile</h1>
            <p className="owner-subtitle">
              Keep your public cafe profile complete, accurate, and ready for real customers.
            </p>

            <div className="owner-profile-stack">
              <div className="owner-profile-card">
                <div className="owner-profile-card-head">
                  <h2>Cafe Logo</h2>
                </div>

                <div className="owner-logo-row owner-logo-section">
                  <div className="owner-logo-preview owner-logo-preview-large" aria-label="Cafe logo preview">
                    {logoUrl ? (
                      <img src={logoUrl} alt={`${name || "Cafe"} logo preview`} />
                    ) : (
                      <Coffee size={44} />
                    )}
                  </div>

                  <div className="owner-logo-copy">
                    <p>Upload your cafe logo. Recommended size: 200x200px.</p>
                    <button
                      type="button"
                      className="owner-secondary"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload size={14} />
                      Upload Logo
                    </button>
                    <small>JPG, PNG, or WebP. Max 2MB. Save Profile after choosing.</small>
                  </div>

                  <input
                    ref={logoInputRef}
                    className="owner-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>

              <div className="owner-profile-card">
                <div className="owner-profile-card-head">
                  <h2>Basic Information</h2>
                </div>

                <div className="owner-form-grid owner-profile-grid">
                  <div>
                    <label htmlFor="owner-cafe-name">Cafe Name <span>*</span></label>
                    <input
                      id="owner-cafe-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Brew & Bean"
                    />
                    <small>This will be displayed on your public website</small>
                  </div>

                  <div>
                    <label htmlFor="owner-name">Owner Name</label>
                    <input
                      id="owner-name"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label htmlFor="owner-contact-email">Email Address</label>
                    <input
                      id="owner-contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="owner@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="owner-phone">Phone Number <span>*</span></label>
                    <input
                      id="owner-phone"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+966 5x xxx xxxx"
                    />
                    <small>Required so customers can contact your cafe directly.</small>
                  </div>

                  <div className="full">
                    <label htmlFor="owner-description">Description</label>
                    <textarea
                      id="owner-description"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="A cozy neighborhood cafe serving specialty coffee and fresh pastries."
                    />
                  </div>
                </div>
              </div>

              <div className="owner-profile-card">
                <div className="owner-profile-card-head">
                  <div>
                    <h2>Social Media Accounts</h2>
                    <p>Optional. If you add accounts, customers will see them in your contact section.</p>
                  </div>
                </div>

                <div className="owner-form-grid owner-profile-grid owner-social-grid">
                  {SOCIAL_LINK_FIELDS.map((field) => (
                    <div key={field.key}>
                      <label htmlFor={`owner-social-${field.key}`}>{field.label}</label>
                      <input
                        id={`owner-social-${field.key}`}
                        value={socialLinks[field.key] || ""}
                        onChange={(e) => updateSocialLink(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                  <p className="owner-social-help full">
                    Use a full URL or account handle. Leave every field blank if you do not want
                    to show social media links to customers.
                  </p>
                </div>
              </div>

              <div className="owner-profile-card">
                <div className="owner-profile-card-head">
                  <div>
                    <h2>Location <span>*</span></h2>
                    <p>Required. Customers see this in the cafe menu Visit Us section.</p>
                  </div>
                </div>

                <div className="owner-form-grid owner-profile-grid">
                  <div className="full">
                    <label htmlFor="owner-address">Address <span>*</span></label>
                    <input
                      id="owner-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main Street, Downtown"
                    />
                  </div>

                  <div>
                    <label htmlFor="owner-city">City <span>*</span></label>
                    <input
                      id="owner-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Riyadh"
                    />
                  </div>

                  <div>
                    <label htmlFor="owner-state">State / Region <span>*</span></label>
                    <input
                      id="owner-state"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      placeholder="Riyadh Province"
                    />
                  </div>

                  <div>
                    <label htmlFor="owner-zip">Zip Code <span>*</span></label>
                    <input
                      id="owner-zip"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                </div>
              </div>

              <div className="owner-profile-card">
                <div className="owner-profile-card-head owner-hours-head">
                  <div>
                    <h2>Working Hours</h2>
                    <p>Set the opening and closing time customers should see.</p>
                  </div>
                  <button
                    type="button"
                    className="owner-secondary"
                    onClick={applyMondayHoursToAll}
                  >
                    Apply Monday to All
                  </button>
                </div>

                <div className="owner-week-hours">
                  {WEEK_DAYS.map((day) => (
                    <div className="owner-week-hours-row" key={day.key}>
                      <label htmlFor={`owner-${day.key}-open`}>{day.label}</label>
                      <input
                        id={`owner-${day.key}-open`}
                        type="time"
                        value={weeklyHours[day.key].open}
                        onChange={(e) => updateWeeklyHours(day.key, "open", e.target.value)}
                      />
                      <span>to</span>
                      <input
                        id={`owner-${day.key}-close`}
                        type="time"
                        value={weeklyHours[day.key].close}
                        onChange={(e) => updateWeeklyHours(day.key, "close", e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="owner-profile-actions">
              <button type="button" className="owner-primary" onClick={saveProfile}>
                Save Profile
              </button>
              <p className={profileMessageType || "small"}>{profileMessage || " "}</p>
            </div>
          </section>
        )}

        {activeSection === "menu" && (
          <section>
            <div className="owner-section-head">
              <div>
                <h1 className="owner-title">Menu Management</h1>
                <p className="owner-subtitle">
                  Build your public menu by category, add prices in SAR, and save every change to MongoDB.
                </p>
              </div>
              <button type="button" className="owner-secondary" onClick={() => navigate("/preview")}>
                <Eye size={14} />
                Preview Customer Menu
              </button>
            </div>

            <div className="owner-menu-layout">
              <div className="owner-panel">
                <div className="owner-panel-heading">
                  <div>
                    <h2>Menu Categories</h2>
                    <p>Start with sections like Coffee, Desserts, or Breakfast.</p>
                  </div>
                </div>

                <div className="owner-category-composer">
                  <label htmlFor="owner-new-category">Category Name</label>
                  <div className="owner-inline-add">
                    <input
                      id="owner-new-category"
                      placeholder="Example: Hot Coffee"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <button type="button" className="owner-primary" onClick={addCategory}>
                      <Plus size={14} />
                      <span>Add Category</span>
                    </button>
                  </div>
                </div>

                {editingCategoryIndex !== null && (
                  <div className="owner-edit-card">
                    <h3>Edit Category</h3>
                    <label htmlFor="owner-edit-category">Category Name</label>
                    <input
                      id="owner-edit-category"
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      placeholder="Category name"
                    />
                    <div className="owner-item-actions">
                      <button
                        type="button"
                        className="owner-primary"
                        onClick={saveEditedCategory}
                      >
                        Save Category
                      </button>
                      <button
                        type="button"
                        className="owner-secondary"
                        onClick={cancelEditCategory}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <ul className="owner-categories">
                  {menuData.length === 0 && (
                    <p className="owner-empty-state">No categories yet. Add one to begin.</p>
                  )}
                  {menuData.map((category, index) => {
                    const isCategoryShown = category.visible !== false;
                    const categoryButtonClass = [
                      newItemCategory === index ? "active" : "",
                      isCategoryShown ? "" : "is-hidden",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <li key={category.name + index}>
                        <button
                          type="button"
                          className={categoryButtonClass}
                          onClick={() => setNewItemCategory(index)}
                        >
                          <span>
                            {category.name}
                            <em
                              className={`owner-visibility ${
                                isCategoryShown ? "shown" : "hidden"
                              }`}
                            >
                              {isCategoryShown ? "Shown" : "Hidden"}
                            </em>
                          </span>
                          <small>{category.items.length} items</small>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="owner-panel">
                <div className="owner-panel-heading">
                  <div>
                    <h2>Menu Items</h2>
                    <p>
                      {menuData[newItemCategory]
                        ? `Adding items to ${menuData[newItemCategory].name}.`
                        : "Choose or create a category before adding items."}
                    </p>
                  </div>
                  {menuData[newItemCategory] && (
                    <span className="owner-count-pill">
                      {menuData[newItemCategory].items.length} items
                    </span>
                  )}
                </div>

                {menuData[newItemCategory] && (
                  <div className="owner-item-actions owner-category-actions">
                    <span
                      className={`owner-visibility ${
                        menuData[newItemCategory].visible !== false ? "shown" : "hidden"
                      }`}
                    >
                      {menuData[newItemCategory].visible !== false
                        ? "Shown to clients"
                        : "Hidden from clients"}
                    </span>
                    <button
                      type="button"
                      className="owner-secondary"
                      onClick={() => toggleCategoryVisibility(newItemCategory)}
                    >
                      {menuData[newItemCategory].visible !== false
                        ? "Hide Category"
                        : "Show Category"}
                    </button>
                    <button
                      type="button"
                      className="owner-secondary"
                      onClick={() => startEditCategory(newItemCategory)}
                    >
                      Edit Category
                    </button>
                    <button
                      type="button"
                      className="owner-danger"
                      onClick={() => removeCategory(newItemCategory)}
                    >
                      Delete Category
                    </button>
                  </div>
                )}

                {menuData[newItemCategory] ? (
                  <div className="owner-add-item-card">
                    <div>
                      <label htmlFor="owner-new-item-name">Item Name</label>
                      <input
                        id="owner-new-item-name"
                        placeholder="Example: Iced Latte"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="owner-new-item-price">Price in SAR</label>
                      <div className="owner-price-input">
                        <span>SAR</span>
                        <input
                          id="owner-new-item-price"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    <button type="button" className="owner-primary" onClick={addItem}>
                      <Plus size={14} />
                      <span>Add Item</span>
                    </button>
                  </div>
                ) : (
                  <p className="owner-empty-state">
                    Create a category first, then you can add menu items and SAR prices here.
                  </p>
                )}

                <div className="owner-items">
                  {menuData[newItemCategory]?.items?.length ? (
                    menuData[newItemCategory].items.map((item, index) => {
                      const isItemShown = item.visible !== false;

                      return (
                        <div
                          key={item.name + index}
                          className={`owner-item-row${isItemShown ? "" : " is-hidden"}`}
                        >
                        {editingItem?.categoryIndex === newItemCategory &&
                        editingItem.itemIndex === index ? (
                          <>
                            <div className="owner-edit-item-grid">
                              <div>
                                <label htmlFor={`edit-item-name-${index}`}>Item Name</label>
                                <input
                                  id={`edit-item-name-${index}`}
                                  value={editingItemName}
                                  onChange={(e) => setEditingItemName(e.target.value)}
                                  placeholder="Item name"
                                />
                              </div>
                              <div>
                                <label htmlFor={`edit-item-price-${index}`}>Price in SAR</label>
                                <div className="owner-price-input">
                                  <span>SAR</span>
                                  <input
                                    id={`edit-item-price-${index}`}
                                    inputMode="decimal"
                                    value={editingItemPrice}
                                    onChange={(e) => setEditingItemPrice(e.target.value)}
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="owner-item-actions">
                              <button
                                type="button"
                                className="owner-primary"
                                onClick={saveEditedItem}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="owner-secondary"
                                onClick={cancelEditItem}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <div className="owner-item-heading">
                                <strong>{item.name}</strong>
                                <span
                                  className={`owner-visibility ${
                                    isItemShown ? "shown" : "hidden"
                                  }`}
                                >
                                  {isItemShown ? "Shown" : "Hidden"}
                                </span>
                              </div>
                              <p>{item.description || "Saved in your menu database."}</p>
                            </div>

                            <div className="owner-item-actions">
                              <div className="owner-item-price">
                                <span>SAR</span>
                                {item.price}
                              </div>
                              <button
                                type="button"
                                className="owner-secondary"
                                onClick={() => toggleItemVisibility(newItemCategory, index)}
                              >
                                {isItemShown ? "Hide" : "Show"}
                              </button>
                              <button
                                type="button"
                                className="owner-secondary"
                                onClick={() => startEditItem(newItemCategory, index)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="owner-danger"
                                onClick={() => removeItem(newItemCategory, index)}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      );
                    })
                  ) : (
                    <p className="owner-empty-state">No items yet for this category.</p>
                  )}
                </div>
              </div>
            </div>

            <p
              className={
                menuMessage.includes("successfully")
                  ? "success"
                  : menuMessage
                  ? "error"
                  : "small"
              }
            >
              {menuMessage || " "}
            </p>
          </section>
        )}

        {activeSection === "orders" && (
          <section>
            <div className="owner-section-head">
              <div>
                <h1 className="owner-title">Orders</h1>
                <p className="owner-subtitle">
                  Manage customer orders for {name}, update delivery status, and review full order details.
                </p>
              </div>
              <button
                type="button"
                className="owner-secondary"
                onClick={() => loadOwnerOrders(cafe?._id || "")}
              >
                <ReceiptText size={14} />
                Refresh Orders
              </button>
            </div>

            <div className="owner-stats owner-order-stats">
              <div className="owner-stat-card">
                <ReceiptText size={20} />
                <strong>{orderCounts.month}</strong>
                <span>Orders This Month</span>
              </div>
              <div className="owner-stat-card">
                <Clock3 size={20} />
                <strong>{orderCounts.today}</strong>
                <span>Orders Today</span>
              </div>
              <div className="owner-stat-card">
                <Truck size={20} />
                <strong>{orderCounts.onTheWay}</strong>
                <span>On the Way</span>
              </div>
              <div className="owner-stat-card">
                <CheckCircle2 size={20} />
                <strong>{orderCounts.delivered}</strong>
                <span>Delivered</span>
              </div>
              <div className="owner-stat-card">
                <Ban size={20} />
                <strong>{orderCounts.cancelled}</strong>
                <span>Cancelled</span>
              </div>
            </div>

            <div className="owner-panel owner-orders-panel">
              <div className="owner-panel-heading">
                <div>
                  <h2>Live Cafe Orders</h2>
                  <p>Orders are shared with the client account, so every status update appears in their Orders page.</p>
                </div>
                <span className="owner-count-pill">{visibleOrders.length} shown</span>
              </div>

              <div className="owner-order-tools">
                <label htmlFor="owner-order-period">
                  Time period
                  <select
                    id="owner-order-period"
                    value={orderPeriod}
                    onChange={(e) => setOrderPeriod(e.target.value as OwnerOrderPeriod)}
                  >
                    <option value="all">All dates</option>
                    <option value="today">Today only</option>
                    <option value="month">This month</option>
                  </select>
                </label>

                <label htmlFor="owner-order-filter">
                  Status
                  <select
                    id="owner-order-filter"
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value as OwnerOrderFilter)}
                  >
                    <option value="all">All statuses</option>
                    {ORDER_STATUS_OPTIONS.map((statusOption) => (
                      <option value={statusOption} key={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </label>

                <label htmlFor="owner-order-sort">
                  Sort
                  <select
                    id="owner-order-sort"
                    value={orderSort}
                    onChange={(e) => setOrderSort(e.target.value as OwnerOrderSort)}
                  >
                    <option value="recent">Recent first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="az">Client A-Z</option>
                    <option value="status">Status flow</option>
                  </select>
                </label>
              </div>

              <div className="owner-order-filter-chips" aria-label="Quick order status filters">
                <button
                  type="button"
                  className={orderFilter === "all" ? "active" : ""}
                  onClick={() => setOrderFilter("all")}
                >
                  All <span>{orderCounts.all}</span>
                </button>
                <button
                  type="button"
                  className={orderFilter === "Delivered" ? "active" : ""}
                  onClick={() => setOrderFilter("Delivered")}
                >
                  Delivered <span>{orderCounts.delivered}</span>
                </button>
                <button
                  type="button"
                  className={orderFilter === "On the way" ? "active" : ""}
                  onClick={() => setOrderFilter("On the way")}
                >
                  On the Way <span>{orderCounts.onTheWay}</span>
                </button>
                <button
                  type="button"
                  className={orderFilter === "Cancelled" ? "active" : ""}
                  onClick={() => setOrderFilter("Cancelled")}
                >
                  Cancelled <span>{orderCounts.cancelled}</span>
                </button>
              </div>

              {ordersMessage && (
                <p className={ordersMessage.includes("updated") ? "success" : "error"}>
                  {ordersMessage}
                </p>
              )}

              {ordersLoading ? (
                <p className="owner-empty-state">Loading orders from the database...</p>
              ) : visibleOrders.length === 0 ? (
                <p className="owner-empty-state">
                  No orders in this view yet. New client orders will appear here automatically after checkout.
                </p>
              ) : (
                <div className="owner-orders-list">
                  {visibleOrders.map((order) => (
                    <article className="owner-order-row" key={order._id}>
                      <div>
                        <strong>{order.orderNumber}</strong>
                        <p>{formatTimestamp(order.createdAt)}</p>
                      </div>
                      <div>
                        <strong>{order.clientName}</strong>
                        <p>{order.clientEmail}</p>
                      </div>
                      <span className={getOwnerOrderStatusClass(order.status)}>{order.status}</span>
                      <strong>{formatOrderTotal(order.total)}</strong>
                      <button
                        type="button"
                        className="owner-secondary"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View Order Details
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {selectedOrder && (
              <div className="owner-panel owner-order-detail">
                <div className="owner-panel-heading">
                  <div>
                    <h2>{selectedOrder.orderNumber}</h2>
                    <p>{formatTimestamp(selectedOrder.createdAt)}</p>
                  </div>
                  <button type="button" className="owner-secondary" onClick={() => setSelectedOrder(null)}>
                    Close Details
                  </button>
                </div>

                <div className="owner-order-detail-grid">
                  <div>
                    <h3>Client</h3>
                    <p><strong>Name:</strong> {selectedOrder.clientName}</p>
                    <p><strong>Email:</strong> {selectedOrder.clientEmail}</p>
                    <p><strong>Phone:</strong> {selectedOrder.clientAddress?.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <h3>Delivery Address</h3>
                    <p>{formatOrderAddress(selectedOrder) || "No address provided"}</p>
                  </div>
                  <div>
                    <h3>Payment</h3>
                    <p><strong>Total:</strong> {formatOrderTotal(selectedOrder.total)}</p>
                    <p><strong>Method:</strong> {selectedOrder.paymentMethod}</p>
                    <p><strong>Status:</strong> <span className={getOwnerOrderStatusClass(selectedOrder.status)}>{selectedOrder.status}</span></p>
                  </div>
                </div>

                <div className="owner-order-items">
                  <h3>Order Items</h3>
                  {selectedOrder.items.map((item) => (
                    <div key={`${selectedOrder._id}-${item.itemId}-${item.name}`}>
                      <span>{item.quantity}x {item.name}</span>
                      <strong>{formatOrderTotal(item.price * item.quantity)}</strong>
                    </div>
                  ))}
                </div>

                <div className="owner-order-status-actions">
                  <button
                    type="button"
                    className="owner-danger"
                    disabled={selectedOrder.status === "Cancelled" || selectedOrder.status === "Delivered"}
                    onClick={() => changeOrderStatus(selectedOrder, "Cancelled")}
                  >
                    <Ban size={14} />
                    Cancel Order
                  </button>
                  <button
                    type="button"
                    className="owner-secondary"
                    disabled={selectedOrder.status === "On the way" || selectedOrder.status === "Delivered" || selectedOrder.status === "Cancelled"}
                    onClick={() => changeOrderStatus(selectedOrder, "On the way")}
                  >
                    <Truck size={14} />
                    On the Way
                  </button>
                  <button
                    type="button"
                    className="owner-primary"
                    disabled={selectedOrder.status === "Delivered" || selectedOrder.status === "Cancelled"}
                    onClick={() => changeOrderStatus(selectedOrder, "Delivered")}
                  >
                    <CheckCircle2 size={14} />
                    Delivered
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {activeSection === "theme" && (
          <section>
            <h1 className="owner-title">Theme Selection</h1>
            <p className="owner-subtitle">
              Custom cafe themes are coming soon for all cafe owners.
            </p>

            <div className="owner-panel owner-coming-soon">
              <Palette size={36} />
              <h2>Coming Soon</h2>
              <p>
                We removed theme editing for now so cafe profiles stay consistent.
                This section will return later with a complete design system.
              </p>
            </div>
          </section>
        )}

        {activeSection === "qr" && (
          <section>
            <h1 className="owner-title">QR Code</h1>
            <p className="owner-subtitle">
              Share this code with customers so scanning it opens your cafe menu directly.
            </p>

            <div className="owner-panel owner-qr-guide">
              <div>
                <h2>How to Use This QR</h2>
                <p>Use this flow when your cafe is ready to accept customer orders.</p>
              </div>
              <div className="owner-qr-steps">
                <span>1. Print or display the QR</span>
                <span>2. Customer scans it</span>
                <span>3. Customer logs in or registers</span>
                <span>4. Customer orders from your menu</span>
                <span>5. You manage the order status</span>
              </div>
            </div>

            <div className="owner-qr-grid">
              <div className="owner-panel">
                <h2>Customer Menu QR</h2>

                {qrImageUrl ? (
                  <div className="owner-qr-card">
                    <img src={qrImageUrl} alt={`QR code for ${name || "your cafe"} menu`} />
                    <strong>{name}</strong>
                    <span>{publicUrl}</span>
                  </div>
                ) : (
                  <div className="owner-qr-soon">
                    <QrCode size={34} />
                    <strong>QR code coming soon</strong>
                    <p>Create your cafe profile first, then this section will generate your menu QR.</p>
                  </div>
                )}
              </div>

              <div className="owner-panel">
                <h2>Public Menu Link</h2>
                <p className="owner-subtitle">{qrTargetUrl || "Unavailable"}</p>

                {status !== "Active" && (
                  <p className="owner-qr-note">
                    Your QR is ready, but customers will only see this cafe in the public client view
                    after admin approval marks it Active.
                  </p>
                )}

                <div className="owner-qr-actions">
                  <button
                    type="button"
                    className="owner-secondary"
                    onClick={() => navigate(publicUrl === "Unavailable" ? "/preview" : publicUrl)}
                    disabled={publicUrl === "Unavailable"}
                  >
                    Open Customer Menu
                  </button>
                  <button type="button" className="owner-secondary" onClick={() => navigate("/preview")}>
                    Preview as Owner
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default OwnerDashboard;
