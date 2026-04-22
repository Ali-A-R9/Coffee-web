const MenuSection = require("../models/MenuSection");
const MenuItem = require("../models/MenuItem");
const Cafe = require("../models/Cafe");

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePrice(value) {
  if (typeof value === "number") return value.toString();
  if (typeof value === "string") return value.trim();
  return "";
}

function isValidPrice(value) {
  return /^\d+(\.\d{1,2})?$/.test(value);
}

function validateMenu(menu) {
  if (!Array.isArray(menu)) {
    return "Menu data must be an array.";
  }

  if (menu.length === 0) {
    return "Menu must contain at least one category.";
  }

  const seenCategories = new Set();

  for (const section of menu) {
    const sectionName = normalizeText(section?.name);

    if (!sectionName) {
      return "Each category must have a valid name.";
    }

    const lowerSectionName = sectionName.toLowerCase();
    if (seenCategories.has(lowerSectionName)) {
      return `Duplicate category name: "${sectionName}".`;
    }
    seenCategories.add(lowerSectionName);

    if (!Array.isArray(section.items)) {
      return `Category "${sectionName}" must contain an items array.`;
    }

    const seenItems = new Set();

    for (const item of section.items) {
      const itemName = normalizeText(item?.name);
      const itemPrice = normalizePrice(item?.price);

      if (!itemName) {
        return `Each item in "${sectionName}" must have a valid name.`;
      }

      const lowerItemName = itemName.toLowerCase();
      if (seenItems.has(lowerItemName)) {
        return `Duplicate item name "${itemName}" in category "${sectionName}".`;
      }
      seenItems.add(lowerItemName);

      if (!itemPrice) {
        return `Item "${itemName}" in "${sectionName}" must have a price.`;
      }

      if (!isValidPrice(itemPrice)) {
        return `Item "${itemName}" in "${sectionName}" has invalid price format. Use numbers like 10 or 10.50.`;
      }
    }
  }

  return null;
}

// GET /api/menu
exports.getMenu = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const cafe = await Cafe.findOne({ ownerId });
    if (!cafe) {
      return res.json([]);
    }

    const sections = await MenuSection.find({ cafeId: cafe._id }).sort({ _id: 1 });
    const items = await MenuItem.find({ cafeId: cafe._id }).sort({ _id: 1 });

    const result = sections.map((section) => ({
      name: section.title,
      items: items
        .filter((item) => item.sectionId.toString() === section._id.toString())
        .map((item) => ({
          id: item._id,
          name: item.name,
          price: item.price,
        })),
    }));

    res.json(result);
  } catch (err) {
    console.error("getMenu error:", err);
    res.status(500).json({ message: "Failed to load menu." });
  }
};

// POST /api/menu
exports.saveMenu = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const menu = req.body;

    const validationError = validateMenu(menu);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const cafe = await Cafe.findOne({ ownerId });
    if (!cafe) {
      return res.status(404).json({ message: "Cafe not found." });
    }

    await MenuSection.deleteMany({ cafeId: cafe._id });
    await MenuItem.deleteMany({ cafeId: cafe._id });

    for (const section of menu) {
      const newSection = await MenuSection.create({
        cafeId: cafe._id,
        title: section.name.trim(),
      });

      for (const item of section.items) {
        await MenuItem.create({
          cafeId: cafe._id,
          sectionId: newSection._id,
          name: item.name.trim(),
          price: normalizePrice(item.price),
        });
      }
    }

    res.json({ message: "Menu saved successfully." });
  } catch (err) {
    console.error("saveMenu error:", err);
    res.status(500).json({ message: "Failed to save menu." });
  }
};
