const mongoose = require("mongoose");

const cafeSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true // one cafe per owner
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    ownerName: String,
    contactEmail: String,
    phone: String,
    socialLinks: {
      instagram: {
        type: String,
        default: "",
      },
      x: {
        type: String,
        default: "",
      },
      tiktok: {
        type: String,
        default: "",
      },
      snapchat: {
        type: String,
        default: "",
      },
      website: {
        type: String,
        default: "",
      },
    },
    address: String,
    city: String,
    state: String,
    zipCode: String,
    hours: {
      open: String,
      close: String,
    },
    workingHours: {
      monday: {
        open: String,
        close: String,
      },
      tuesday: {
        open: String,
        close: String,
      },
      wednesday: {
        open: String,
        close: String,
      },
      thursday: {
        open: String,
        close: String,
      },
      friday: {
        open: String,
        close: String,
      },
      saturday: {
        open: String,
        close: String,
      },
      sunday: {
        open: String,
        close: String,
      },
    },
    logoUrl: String,
    status: {
      type: String,
      enum: ["Pending", "Active", "Declined"],
      default: "Pending",
    },
    adminComment: {
      type: String,
      default: "",
      maxlength: 300,
    },
  },
  {
    timestamps: true,
    collection: "cafes",
  }
);

module.exports = mongoose.models.Cafe || mongoose.model("Cafe", cafeSchema);
