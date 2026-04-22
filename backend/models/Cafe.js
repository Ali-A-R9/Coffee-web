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
    hours: {
      open: String,
      close: String,
    },
    logoUrl: String,
    theme: {
      type: String,
      default: "light",
    },
    status: {
      type: String,
      enum: ["Pending", "Active"],
      default: "Pending",
},
  },
  {
    timestamps: true,
    collection: "cafes",
  }
);

module.exports = mongoose.models.Cafe || mongoose.model("Cafe", cafeSchema);
