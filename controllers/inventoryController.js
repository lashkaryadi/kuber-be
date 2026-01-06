// import * as Inventory from '../models/inventoryModel.js';

// export function getAllItems(req, res, next) {
//   try {
//     const items = Inventory.getAll();
//     res.json(items);
//   } catch (err) {
//     next(err);
//   }
// }

// export function getItemById(req, res, next) {
//   try {
//     const item = Inventory.getById(req.params.id);
//     if (!item) return res.status(404).json({ message: 'Item not found' });
//     res.json(item);
//   } catch (err) {
//     next(err);
//   }
// }

// export function createItem(req, res, next) {
//   try {
//     const created = Inventory.create(req.body);
//     res.status(201).json(created);
//   } catch (err) {
//     if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
//       err.status = 409;
//       err.message = 'Serial Number must be unique';
//     }
//     next(err);
//   }
// }

// export function updateItem(req, res, next) {
//   try {
//     const changes = Inventory.update(req.params.id, req.body);
//     if (changes === 0) return res.status(404).json({ message: 'Item not found' });
//     res.json({ message: 'Item updated' });
//   } catch (err) {
//     next(err);
//   }
// }

// export function deleteItem(req, res, next) {
//   try {
//     const changes = Inventory.remove(req.params.id);
//     if (changes === 0) return res.status(404).json({ message: 'Item not found' });
//     res.json({ message: 'Item deleted' });
//   } catch (err) {
//     next(err);
//   }
// }

import Inventory from "../models/inventoryModel.js";

/* GET ALL */
export const getInventory = async (req, res) => {
  const items = await Inventory.find()
    .populate("category", "name")
    .sort({ createdAt: -1 });

  res.json(items);
};

/* CREATE */
export const createInventoryItem = async (req, res) => {
  const {
    serialNumber,
    category,
    pieces,
    weight,
    weightUnit,
    purchaseCode,
    saleCode,
  } = req.body;

  if (
    !serialNumber ||
    !category ||
    !pieces ||
    !weight ||
    !weightUnit ||
    !purchaseCode ||
    !saleCode
  ) {
    return res.status(400).json({
      message: "Missing required fields",
    });
  }

  const item = await Inventory.create(req.body);
  res.status(201).json(item);
};


/* UPDATE */
export const updateInventoryItem = async (req, res) => {
  const item = await Inventory.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }

  res.json(item);
};

/* DELETE */
export const deleteInventoryItem = async (req, res) => {
  await Inventory.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
