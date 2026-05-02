const mongoose = require("mongoose");

const orderAddressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    line1: String,
    city: String,
    region: String,
    postalCode: String,
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    itemId: String,
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cafeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cafe",
      required: true,
    },
    cafeName: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientEmail: {
      type: String,
      required: true,
    },
    clientAddress: orderAddressSchema,
    items: {
      type: [orderItemSchema],
      default: [],
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: "Order must include at least one item.",
      },
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      default: "Demo payment",
    },
    status: {
      type: String,
      enum: ["Placed", "On the way", "Delivered", "Cancelled"],
      default: "Placed",
    },
  },
  {
    timestamps: true,
    collection: "orders",
  }
);

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
