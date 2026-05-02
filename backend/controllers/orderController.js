const Cafe = require("../models/Cafe");
const Order = require("../models/Order");
const User = require("../models/User");

const ORDER_STATUSES = ["Placed", "On the way", "Delivered", "Cancelled"];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function generateOrderNumber() {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `ORD-${datePart}-${randomPart}`;
}

function normalizeAddress(address = {}) {
  return {
    fullName: normalizeText(address.fullName).slice(0, 80),
    phone: normalizeText(address.phone).slice(0, 30),
    line1: normalizeText(address.line1).slice(0, 140),
    city: normalizeText(address.city).slice(0, 80),
    region: normalizeText(address.region).slice(0, 80),
    postalCode: normalizeText(address.postalCode).slice(0, 20),
  };
}

function validateAddress(address) {
  if (!address.fullName || !address.phone || !address.line1 || !address.city) {
    return "Client name, phone, street address, and city are required.";
  }

  if (!/^\+?\d[\d\s-]{6,}$/.test(address.phone)) {
    return "Client phone number must use digits, spaces, +, or - only.";
  }

  return "";
}

function normalizeItems(items = []) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      return {
        itemId: normalizeText(item.itemId).slice(0, 80),
        name: normalizeText(item.name).slice(0, 120),
        price: Number.isFinite(price) && price >= 0 ? price : NaN,
        quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : NaN,
      };
    })
    .filter((item) => item.name && Number.isFinite(item.price) && Number.isFinite(item.quantity));
}

function serializeOrder(order) {
  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    clientId: order.clientId,
    cafeId: order.cafeId,
    cafeName: order.cafeName,
    clientName: order.clientName,
    clientEmail: order.clientEmail,
    clientAddress: order.clientAddress,
    items: order.items,
    total: order.total,
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

exports.createOrder = async (req, res) => {
  try {
    const cafeId = normalizeText(req.body.cafeId);
    const paymentMethod = normalizeText(req.body.paymentMethod) || "Demo payment";
    const clientAddress = normalizeAddress(req.body.clientAddress);
    const addressError = validateAddress(clientAddress);
    const items = normalizeItems(req.body.items);

    if (!cafeId) {
      return res.status(400).json({ message: "Cafe is required for this order." });
    }

    if (addressError) {
      return res.status(400).json({ message: addressError });
    }

    if (items.length === 0) {
      return res.status(400).json({ message: "Order must include at least one valid item." });
    }

    const [client, cafe] = await Promise.all([
      User.findById(req.user.id).select("fullName email role"),
      Cafe.findById(cafeId),
    ]);

    if (!client || client.role !== "client") {
      return res.status(403).json({ message: "Only client accounts can place orders." });
    }

    if (!cafe || cafe.status !== "Active") {
      return res.status(404).json({ message: "Cafe is not available for orders." });
    }

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      clientId: client._id,
      cafeId: cafe._id,
      cafeName: cafe.name,
      clientName: clientAddress.fullName || client.fullName,
      clientEmail: client.email,
      clientAddress,
      items,
      total,
      paymentMethod,
      status: "Placed",
    });

    res.status(201).json(serializeOrder(order));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Order number collision. Please try again." });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.getClientOrders = async (req, res) => {
  try {
    const orders = await Order.find({ clientId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders.map(serializeOrder));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOwnerOrders = async (req, res) => {
  try {
    const cafe = await Cafe.findOne({ ownerId: req.user.id });

    if (!cafe) {
      return res.json([]);
    }

    const orders = await Order.find({ cafeId: cafe._id }).sort({ createdAt: -1 });
    res.json(orders.map(serializeOrder));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOwnerOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = normalizeText(req.body.status);

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid order status." });
    }

    const cafe = await Cafe.findOne({ ownerId: req.user.id });
    if (!cafe) {
      return res.status(404).json({ message: "Cafe not found." });
    }

    const order = await Order.findOneAndUpdate(
      { _id: id, cafeId: cafe._id },
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found for this cafe." });
    }

    res.json(serializeOrder(order));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
