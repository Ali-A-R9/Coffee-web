export type OrderStatus = "Placed" | "On the way" | "Delivered" | "Cancelled";

export type OrderAddress = {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  region?: string;
  postalCode?: string;
};

export type OrderItem = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
};

export type CafeOrder = {
  _id: string;
  orderNumber: string;
  clientId: string;
  cafeId: string;
  cafeName: string;
  clientName: string;
  clientEmail: string;
  clientAddress: OrderAddress;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderPayload = {
  cafeId: string;
  cafeName?: string;
  items: OrderItem[];
  clientAddress: OrderAddress;
  paymentMethod: string;
};

const BASE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = `${BASE_API_URL}/api/orders`;
const LOCAL_ORDER_STORAGE_KEY = "cafesite-local-orders";

class OrdersApiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrdersApiUnavailableError";
  }
}

type StoredUser = {
  id?: string;
  fullName?: string;
  email?: string;
};

function getAuthHeaders(json = false): HeadersInit {
  const token = localStorage.getItem("token");

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new OrdersApiUnavailableError("Orders API is not responding with JSON.");
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
}

function isApiUnavailable(error: unknown) {
  return error instanceof OrdersApiUnavailableError || error instanceof TypeError;
}

function getStoredUser(): StoredUser {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return {};

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return {};
  }
}

function readLocalOrders(): CafeOrder[] {
  try {
    const storedOrders = localStorage.getItem(LOCAL_ORDER_STORAGE_KEY);
    return storedOrders ? JSON.parse(storedOrders) : [];
  } catch {
    return [];
  }
}

function writeLocalOrders(orders: CafeOrder[]) {
  localStorage.setItem(LOCAL_ORDER_STORAGE_KEY, JSON.stringify(orders));
}

function sortOrders(orders: CafeOrder[]) {
  return [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function generateLocalOrderNumber() {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `ORD-${datePart}-${randomPart}`;
}

function createLocalOrder(payload: CreateOrderPayload): CafeOrder {
  const user = getStoredUser();
  const now = new Date().toISOString();
  const order: CafeOrder = {
    _id: `LOCAL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    orderNumber: generateLocalOrderNumber(),
    clientId: user.id || user.email || "local-client",
    cafeId: payload.cafeId,
    cafeName: payload.cafeName || "Cafe",
    clientName: payload.clientAddress.fullName || user.fullName || "Client",
    clientEmail: user.email || "client@example.com",
    clientAddress: payload.clientAddress,
    items: payload.items,
    total: payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    paymentMethod: payload.paymentMethod,
    status: "Placed",
    createdAt: now,
    updatedAt: now,
  };

  writeLocalOrders([order, ...readLocalOrders()]);
  return order;
}

function getLocalClientOrders() {
  const user = getStoredUser();
  const clientId = user.id || user.email || "local-client";

  return sortOrders(
    readLocalOrders().filter((order) => order.clientId === clientId)
  );
}

function getLocalOwnerOrders(cafeId = "") {
  if (!cafeId) return [];

  return sortOrders(
    readLocalOrders().filter((order) => order.cafeId === cafeId)
  );
}

function mergeOrders(primary: CafeOrder[], fallback: CafeOrder[]) {
  const seenIds = new Set(primary.map((order) => order._id));
  const merged = [...primary];

  fallback.forEach((order) => {
    if (!seenIds.has(order._id)) {
      merged.push(order);
    }
  });

  return sortOrders(merged);
}

function updateLocalOrderStatus(orderId: string, status: OrderStatus) {
  const orders = readLocalOrders();
  const nextOrders = orders.map((order) =>
    order._id === orderId
      ? { ...order, status, updatedAt: new Date().toISOString() }
      : order
  );
  const updatedOrder = nextOrders.find((order) => order._id === orderId);

  if (!updatedOrder) {
    throw new Error("Order not found in local orders.");
  }

  writeLocalOrders(nextOrders);
  return updatedOrder;
}

export async function createOrder(payload: CreateOrderPayload): Promise<CafeOrder> {
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });

    return await parseResponse<CafeOrder>(res, "Failed to place order");
  } catch (error) {
    if (isApiUnavailable(error)) {
      return createLocalOrder(payload);
    }

    throw error;
  }
}

export async function getClientOrders(): Promise<CafeOrder[]> {
  try {
    const res = await fetch(`${BASE_URL}/my`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    return mergeOrders(
      await parseResponse<CafeOrder[]>(res, "Failed to load client orders"),
      getLocalClientOrders()
    );
  } catch (error) {
    if (isApiUnavailable(error)) {
      return getLocalClientOrders();
    }

    throw error;
  }
}

export async function getOwnerOrders(cafeId = ""): Promise<CafeOrder[]> {
  try {
    const res = await fetch(`${BASE_URL}/owner`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    return mergeOrders(
      await parseResponse<CafeOrder[]>(res, "Failed to load cafe orders"),
      getLocalOwnerOrders(cafeId)
    );
  } catch (error) {
    if (isApiUnavailable(error)) {
      return getLocalOwnerOrders(cafeId);
    }

    throw error;
  }
}

export async function updateOwnerOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<CafeOrder> {
  if (orderId.startsWith("LOCAL-")) {
    return updateLocalOrderStatus(orderId, status);
  }

  try {
    const res = await fetch(`${BASE_URL}/${orderId}/status`, {
      method: "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ status }),
    });

    return await parseResponse<CafeOrder>(res, "Failed to update order status");
  } catch (error) {
    if (isApiUnavailable(error)) {
      return updateLocalOrderStatus(orderId, status);
    }

    throw error;
  }
}
