// import Category from "../models/Category.js";

// // GET
// export const getCategories = async (req, res) => {
//   const categories = await Category.find().sort({ createdAt: -1 });

//   res.json(
//     categories.map((cat) => ({
//       id: cat._id.toString(),   // 🔥 MOST IMPORTANT LINE
//       name: cat.name,
//       description: cat.description,
//       createdAt: cat.createdAt,
//     }))
//   );
// };


// // CREATE
// export const createCategory = async (req, res) => {
//   const { name, description } = req.body;

//   if (!name) {
//     return res.status(400).json({ message: "Category name required" });
//   }

//   const category = await Category.create({
//     name,
//     description,
//     createdBy: req.user._id,
//   });

//   res.status(201).json({
//     id: category._id.toString(),
//     name: category.name,
//     description: category.description,
//     createdAt: category.createdAt,
//   });
// };



// // UPDATE
// export const updateCategory = async (req, res) => {
//   const category = await Category.findByIdAndUpdate(
//     req.params.id,
//     req.body,
//     { new: true }
//   );

//   res.json({
//     id: category._id.toString(),
//     name: category.name,
//     description: category.description,
//     createdAt: category.createdAt,
//   });
// };


// // DELETE
// export const deleteCategory = async (req, res) => {
//   const { id } = req.params;

//   if (!id || id === "undefined") {
//     return res.status(400).json({ message: "Invalid category ID" });
//   }

//   await Category.findByIdAndDelete(id);
//   res.json({ success: true });
// };
import Inventory from "../models/inventoryModel.js";
import Category from "../models/Category.js";

/* GET */
export const getCategories = async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  res.json(categories);
};

/* CREATE */
export const createCategory = async (req, res) => {
  const { name, description } = req.body;

  const exists = await Category.findOne({ name });
  if (exists) {
    return res.status(409).json({ message: "Category already exists" });
  }

  const category = await Category.create({
    name,
    description,
    createdBy: req.user.id,
  });

  res.status(201).json(category);
};

/* UPDATE */
export const updateCategory = async (req, res) => {
  const { name, description } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  category.name = name ?? category.name;
  category.description = description ?? category.description;

  await category.save();
  res.json(category);
};

/* DELETE */
// export const deleteCategory = async (req, res) => {
//   await Category.findByIdAndDelete(req.params.id);
//   res.json({ success: true });
// };
export const deleteCategory = async (req, res) => {
  const used = await Inventory.exists({ category: req.params.id });

  if (used) {
    return res.status(400).json({
      message: "Category is used in inventory and cannot be deleted",
    });
  }

  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};





