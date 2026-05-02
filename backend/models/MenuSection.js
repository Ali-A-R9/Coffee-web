const mongoose = require("mongoose");

const menuSectionSchema = new mongoose.Schema(
  {
    cafeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cafe",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    visible: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: "menusections",
  }
);

module.exports =
  mongoose.models.MenuSection ||
  mongoose.model("MenuSection", menuSectionSchema);
