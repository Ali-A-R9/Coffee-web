const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    cafeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cafe",
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuSection",
      required: true,
    },
    name: String,
    price: String,
  },
  {
    collection: "menuitems",
  }
);

module.exports =
  mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);
