const MenuSection = require("../models/MenuSection");
const MenuItem = require("../models/MenuItem");
const Cafe = require("../models/Cafe");

// GET menu
exports.getMenu = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const cafe = await Cafe.findOne({ ownerId });
    if (!cafe) return res.json([]);

    const sections = await MenuSection.find({ cafeId: cafe._id });
    const items = await MenuItem.find({ cafeId: cafe._id });

    const result = sections.map(section => ({
      name: section.title,
      items: items
        .filter(i => i.sectionId.toString() === section._id.toString())
        .map(i => ({
          name: i.name,
          price: i.price,
        })),
    }));

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SAVE menu
exports.saveMenu = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const menu = req.body;

    const cafe = await Cafe.findOne({ ownerId });
    if (!cafe) return res.status(404).json({ message: "Cafe not found" });

    await MenuSection.deleteMany({ cafeId: cafe._id });
    await MenuItem.deleteMany({ cafeId: cafe._id });

    for (const section of menu) {
      const newSection = await MenuSection.create({
        cafeId: cafe._id,
        title: section.name,
      });

      for (const item of section.items) {
        await MenuItem.create({
          cafeId: cafe._id,
          sectionId: newSection._id,
          name: item.name,
          price: item.price,
        });
      }
    }

    res.json({ message: "Menu saved" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};