// Script to clean all pending shared rides from database
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanPendingSharedRides() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const ridesCollection = db.collection('ride-requests');

    // Find all pending shared rides
    const pendingSharedRides = await ridesCollection
      .find({
        rideMode: 'shared',
        status: { $in: ['pending', 'searching'] },
      })
      .toArray();

    console.log(
      `\n📊 Found ${pendingSharedRides.length} pending shared rides:`,
    );
    pendingSharedRides.forEach((ride) => {
      console.log(
        `  - ID: ${ride._id}, Status: ${ride.status}, Passenger: ${ride.passengerID}`,
      );
    });

    if (pendingSharedRides.length > 0) {
      // Delete all pending shared rides
      const result = await ridesCollection.deleteMany({
        rideMode: 'shared',
        status: { $in: ['pending', 'searching'] },
      });

      console.log(`\n✅ Deleted ${result.deletedCount} pending shared rides`);
    } else {
      console.log('\n✅ No pending shared rides to delete');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanPendingSharedRides();
