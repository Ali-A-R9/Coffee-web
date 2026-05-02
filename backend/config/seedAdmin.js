const bcrypt = require("bcryptjs");
const User = require("../models/User");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function seedAdminUser() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const fullName = (process.env.ADMIN_FULL_NAME || "CafeSite Admin").trim() || "CafeSite Admin";

  if (!email && !password) {
    return;
  }

  if (!email || !password) {
    console.warn("Admin seed skipped: both ADMIN_EMAIL and ADMIN_PASSWORD are required.");
    return;
  }

  if (!isValidEmail(email)) {
    console.warn("Admin seed skipped: ADMIN_EMAIL must be a valid email address.");
    return;
  }

  if (password.length < 8) {
    console.warn("Admin seed skipped: ADMIN_PASSWORD must be at least 8 characters long.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await User.findOneAndUpdate(
    { email },
    {
      fullName,
      email,
      passwordHash,
      role: "admin",
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  console.log(`Admin account ready: ${email}`);
}

module.exports = seedAdminUser;
