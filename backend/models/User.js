const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["client", "owner", "admin"],
      default: "client",
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
