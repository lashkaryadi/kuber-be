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
import Sold from "../models/soldModel.js";
import Invoice from "../models/Invoice.js";

/* GET ALL */
export const getInventory = async (req, res) => {
  const items = await Inventory.find()
    .populate("category", "name")
    .sort({ createdAt: -1 });

  res.json(items);
};

/* CREATE */
export const createInventoryItem = async (req, res, next) => {
  try {
    const {
      serialNumber,
      category,
      pieces,
      weight,
      weightUnit,
      purchaseCode,
      saleCode,
    } = req.body;

    // 🔒 BASIC VALIDATION (same as before)
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
        success: false,
        message: "Missing required fields",
      });
    }

    // ✅ CREATE INVENTORY ITEM
    const item = await Inventory.create(req.body);

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (err) {
    // 🔥 DUPLICATE SERIAL NUMBER (MongoDB unique index)
    if (err.code === 11000 && err.keyPattern?.serialNumber) {
      return res.status(409).json({
        success: false,
        message: "Inventory item with this serial number already exists",
        field: "serialNumber",
      });
    }

    // ❗ ANY OTHER ERROR
    next(err);
  }
};



/* UPDATE */
// export const updateInventoryItem = async (req, res) => {
//   const item = await Inventory.findByIdAndUpdate(
//     req.params.id,
//     req.body,
//     { new: true }
//   );

//   if (!item) {
//     return res.status(404).json({ message: "Item not found" });
//   }

//   res.json(item);
// };
export const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Inventory.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    // 🔥 DUPLICATE SERIAL NUMBER HANDLING
    if (error.code === 11000 && error.keyPattern?.serialNumber) {
      return res.status(409).json({
        success: false,
        message: "Serial number already exists",
        field: "serialNumber",
      });
    }

    console.error("Update inventory error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update inventory item",
    });
  }
};


/* DELETE */
export async function deleteInventoryItem(req, res, next) {
  try {
    const { id } = req.params;

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    /* 🔥 FIND SOLD RECORD */
    const sold = await Sold.findOne({ inventoryItem: inventory._id });

    if (sold) {
      /* 🔥 DELETE INVOICE FIRST */
      await Invoice.findOneAndDelete({ soldItem: sold._id });

      /* 🔥 DELETE SOLD */
      await sold.deleteOne();
    }

    /* 🔥 DELETE INVENTORY */
    await inventory.deleteOne();

    res.json({
      success: true,
      message: "Inventory and related sales deleted",
    });
  } catch (err) {
    next(err);
  }
}
