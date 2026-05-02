const Cafe = require("../models/Cafe");
const MenuSection = require("../models/MenuSection");
const MenuItem = require("../models/MenuItem");

async function buildCafeWithMenu(cafe) {
  const sections = await MenuSection.find({ cafeId: cafe._id }).sort({ _id: 1 });
  const items = await MenuItem.find({ cafeId: cafe._id }).sort({ _id: 1 });

  return {
    _id: cafe._id,
    ownerId: cafe.ownerId,
    name: cafe.name,
    slug: cafe.slug,
    description: cafe.description,
    ownerName: cafe.ownerName,
    contactEmail: cafe.contactEmail,
    phone: cafe.phone,
    address: cafe.address,
    city: cafe.city,
    state: cafe.state,
    zipCode: cafe.zipCode,
    hours: cafe.hours,
    workingHours: cafe.workingHours,
    logoUrl: cafe.logoUrl,
    status: cafe.status,
    adminComment: cafe.adminComment,
    createdAt: cafe.createdAt,
    updatedAt: cafe.updatedAt,
    menu: sections.map((section) => ({
      name: section.title,
      items: items
        .filter((item) => item.sectionId.toString() === section._id.toString())
        .map((item) => ({
          id: item._id,
          name: item.name,
          price: item.price,
        })),
    })),
  };
}

// Create Cafe
exports.createCafe = async (req, res) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.user.id;
    const trimmedName = name?.trim();

    const existingCafe = await Cafe.findOne({ ownerId });
    if (existingCafe) {
      return res.status(400).json({ message: "You already have a cafe" });
    }

    if (!trimmedName) {
      return res.status(400).json({ message: "Cafe name is required" });
    }

    const slug = trimmedName.toLowerCase().replace(/\s+/g, "-");

    const cafe = new Cafe({
      ownerId,
      name: trimmedName,
      slug,
      description,
      status: "Pending",
    });

    await cafe.save();

    res.status(201).json({
      message: "Cafe created successfully",
      cafe,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my cafe
exports.getMyCafe = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const cafe = await Cafe.findOne({ ownerId });

    if (!cafe) {
      return res.status(404).json({ message: "No cafe found" });
    }

    res.json(cafe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update my cafe
exports.updateCafe = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const allowedUpdates = [
      "name",
      "description",
      "ownerName",
      "contactEmail",
      "phone",
      "address",
      "city",
      "state",
      "zipCode",
      "hours",
      "workingHours",
      "logoUrl",
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedUpdates.includes(key))
    );

    if (typeof updates.name === "string") {
      updates.name = updates.name.trim();

      if (!updates.name) {
        return res.status(400).json({ message: "Cafe name is required" });
      }

      updates.slug = updates.name.toLowerCase().replace(/\s+/g, "-");
    }

    const cafe = await Cafe.findOneAndUpdate({ ownerId }, updates, {
      new: true,
      runValidators: true,
    });

    if (!cafe) {
      return res.status(404).json({ message: "Cafe not found" });
    }

    res.json({
      message: "Cafe updated successfully",
      cafe,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all cafes (Admin)
exports.getAllCafes = async (req, res) => {
  try {
    const cafes = await Cafe.find().populate("ownerId", "email fullName");
    res.json(cafes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active cafes for public/client views
exports.getPublicCafes = async (_req, res) => {
  try {
    const cafes = await Cafe.find({ status: "Active" })
      .sort({ updatedAt: -1 })
      .populate("ownerId", "fullName");

    const result = await Promise.all(cafes.map(buildCafeWithMenu));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update cafe status (Admin)
exports.updateCafeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;
    const allowedStatuses = ["Pending", "Active", "Declined"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid cafe status" });
    }

    const trimmedComment =
      typeof adminComment === "string" ? adminComment.trim().slice(0, 300) : "";

    const updates = {
      status,
      adminComment:
        status === "Declined"
          ? trimmedComment || "Your cafe needs changes before it can be approved."
          : "",
    };

    const cafe = await Cafe.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate("ownerId", "email fullName");

    if (!cafe) {
      return res.status(404).json({ message: "Cafe not found" });
    }

    res.json(cafe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
