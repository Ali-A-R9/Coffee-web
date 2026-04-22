const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  if (typeof password !== "string") {
    return "Password is required";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one special character";
  }

  return null;
}

function toSafeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}

// Register
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const allowedRoles = ["client", "owner"];
    const normalizedRole = typeof role === "string" ? role.trim().toLowerCase() : "client";
    const normalizedFullName = typeof fullName === "string" ? fullName.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const passwordError = validatePassword(password);

    if (!normalizedFullName) {
      return res.status(400).json({ message: "Full name is required" });
    }

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid registration role" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      fullName: normalizedFullName,
      email: normalizedEmail,
      passwordHash,
      role: normalizedRole,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: toSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const normalizedEmail = typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      user: toSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("fullName email role");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update current user
exports.updateMe = async (req, res) => {
  try {
    const updates = {};

    if (typeof req.body.fullName === "string") {
      updates.fullName = req.body.fullName.trim();
      if (!updates.fullName) {
        return res.status(400).json({ message: "Full name is required" });
      }
    }

    if (typeof req.body.email === "string") {
      updates.email = req.body.email.trim().toLowerCase();
      if (!updates.email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: req.user.id },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
      select: "fullName email role",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
