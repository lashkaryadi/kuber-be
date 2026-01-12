import mongoose from "mongoose";
import dotenv from "dotenv";
import Inventory from "./models/inventoryModel.js";
import Sold from "./models/soldModel.js";

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/kuber");
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ Database connection error:", error);
    process.exit(1);
  }
};

const migrateInventoryData = async () => {
  console.log("\n🔄 Step 1: Migrating Inventory Data...\n");

  try {
    const inventoryItems = await Inventory.find({});
    let updated = 0;
    let skipped = 0;

    for (const item of inventoryItems) {
      let needsUpdate = false;

      // Map old pieces/weight to new total/available fields
      if (item.pieces !== undefined && item.totalPieces === undefined) {
        item.totalPieces = item.pieces;
        item.availablePieces = item.pieces; // Initially available = total
        needsUpdate = true;
      }

      if (item.weight !== undefined && item.totalWeight === undefined) {
        item.totalWeight = item.weight;
        item.availableWeight = item.weight; // Initially available = total
        needsUpdate = true;
      }

      // Calculate available quantities based on sold items
      const soldRecords = await Sold.find({ inventoryItem: item._id });

      const totalSoldPieces = soldRecords.reduce(
        (sum, s) => sum + (s.soldPieces || 0),
        0
      );
      const totalSoldWeight = soldRecords.reduce(
        (sum, s) => sum + (s.soldWeight || 0),
        0
      );

      // Update available quantities based on sales
      if (item.totalPieces !== undefined) {
        const calculatedAvailablePieces = Math.max(0, item.totalPieces - totalSoldPieces);
        if (item.availablePieces === undefined || item.availablePieces !== calculatedAvailablePieces) {
          item.availablePieces = calculatedAvailablePieces;
          needsUpdate = true;
        }
      }

      if (item.totalWeight !== undefined) {
        const calculatedAvailableWeight = Math.max(0, item.totalWeight - totalSoldWeight);
        if (item.availableWeight === undefined || item.availableWeight !== calculatedAvailableWeight) {
          item.availableWeight = calculatedAvailableWeight;
          needsUpdate = true;
        }
      }

      // Update status based on availability
      if (item.totalPieces !== undefined && item.totalWeight !== undefined) {
        if (item.availablePieces === 0 && item.availableWeight === 0) {
          if (item.status !== "sold") {
            item.status = "sold";
            needsUpdate = true;
          }
        } else if (item.availablePieces < item.totalPieces || item.availableWeight < item.totalWeight) {
          if (item.status !== "partially_sold") {
            item.status = "partially_sold";
            needsUpdate = true;
          }
        } else if (item.status === "sold" || item.status === "partially_sold") {
          if (item.availablePieces > 0 && item.availableWeight > 0) {
            item.status = "in_stock";
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        await item.save();
        updated++;
        console.log(`✅ Updated: ${item.serialNumber}`);
      } else {
        skipped++;
      }
    }

    console.log(`\n📊 Inventory Migration Summary:`);
    console.log(`   - Updated: ${updated}`);
    console.log(`   - Skipped: ${skipped}`);
  } catch (error) {
    console.error("❌ Inventory migration error:", error);
    throw error;
  }
};

const migrateSoldData = async () => {
  console.log("\n🔄 Step 2: Migrating Sold Data...\n");

  try {
    const soldItems = await Sold.find({}).populate("inventoryItem");
    let updated = 0;
    let skipped = 0;

    for (const sold of soldItems) {
      let needsUpdate = false;

      // Set soldPieces and soldWeight if missing (for existing full sales)
      if (sold.soldPieces === undefined && sold.inventoryItem) {
        // For backward compatibility, assume full sale if no soldPieces
        sold.soldPieces = sold.inventoryItem.availablePieces || sold.inventoryItem.totalPieces || 1;
        needsUpdate = true;
      }

      if (sold.soldWeight === undefined && sold.inventoryItem) {
        // For backward compatibility, assume full sale if no soldWeight
        sold.soldWeight = sold.inventoryItem.availableWeight || sold.inventoryItem.totalWeight || 0;
        needsUpdate = true;
      }

      // Set totalPrice if missing
      if (sold.totalPrice === undefined) {
        sold.totalPrice = sold.price;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await sold.save();
        updated++;
        console.log(`✅ Updated sold record: ${sold._id}`);
      } else {
        skipped++;
      }
    }

    console.log(`\n📊 Sold Migration Summary:`);
    console.log(`   - Updated: ${updated}`);
    console.log(`   - Skipped: ${skipped}`);
  } catch (error) {
    console.error("❌ Sold migration error:", error);
    throw error;
  }
};

const updateIndexes = async () => {
  console.log("\n🔄 Step 3: Updating Database Indexes...\n");

  try {
    // Drop old unique index on serialNumber if it exists
    try {
      await Inventory.collection.dropIndex("serialNumber_1");
      console.log("✅ Removed old serialNumber unique index");
    } catch (err) {
      console.log("ℹ️  Old serialNumber index not found (may not exist or already removed)");
    }

    // Create new compound index
    await Inventory.collection.createIndex({ ownerId: 1, serialNumber: 1 }, { unique: true });
    console.log("✅ Created new compound index for Inventory collection");

    // Create indexes for Sold collection
    await Sold.collection.createIndex({ ownerId: 1, soldDate: -1 });
    await Sold.collection.createIndex({ ownerId: 1, inventoryItem: 1 });
    await Sold.collection.createIndex({ ownerId: 1, isDeleted: 1, createdAt: -1 });
    console.log("✅ Created new indexes for Sold collection");
  } catch (error) {
    console.error("❌ Index migration error:", error);
    // Don't throw error here as it might be expected if index doesn't exist
  }
};

const verifyMigration = async () => {
  console.log("\n🔍 Step 4: Verifying Migration...\n");

  try {
    const sampleInventory = await Inventory.findOne({}).lean();
    if (sampleInventory) {
      console.log("📦 Sample Inventory Item:");
      console.log(`   - Serial: ${sampleInventory.serialNumber}`);
      console.log(`   - Total Pieces: ${sampleInventory.totalPieces}`);
      console.log(`   - Available Pieces: ${sampleInventory.availablePieces}`);
      console.log(`   - Total Weight: ${sampleInventory.totalWeight}`);
      console.log(`   - Available Weight: ${sampleInventory.availableWeight}`);
      console.log(`   - Status: ${sampleInventory.status}`);
    }

    const sampleSold = await Sold.findOne({}).lean();
    if (sampleSold) {
      console.log("\n💰 Sample Sold Record:");
      console.log(`   - Sold Pieces: ${sampleSold.soldPieces}`);
      console.log(`   - Sold Weight: ${sampleSold.soldWeight}`);
      console.log(`   - Price: ${sampleSold.price}`);
      console.log(`   - Total Price: ${sampleSold.totalPrice}`);
    }

    console.log("\n✅ Migration verification complete!");
  } catch (error) {
    console.error("❌ Verification error:", error);
    throw error;
  }
};

const runMigration = async () => {
  console.log("\n🚀 Starting Migration to Partial Sales System...\n");

  try {
    await connectDB()();

    await migrateInventoryData()();
    await migrateSoldData()();
    await updateIndexes()();
    await verifyMigration()();

    console.log("\n✅✅✅ MIGRATION COMPLETED SUCCESSFULLY! ✅✅✅\n");
    console.log("Next steps:");
    console.log("1. Restart your backend server");
    console.log("2. Test creating new inventory items");
    console.log("3. Test partial sales");
    console.log("4. Verify invoice generation\n");
  } catch (error) {
    console.error("\n❌❌❌ MIGRATION FAILED! ❌❌❌\n");
    console.error("Error:", error);
    console.log("\nPlease fix the error and run the migration again.\n");
  } finally {
    process.exit(0);
  }
};

runMigration();