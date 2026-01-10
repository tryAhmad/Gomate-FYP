// migrate-passenger-gender.js
// Script to add default gender field to existing passengers

require('dotenv').config();
const mongoose = require('mongoose');

async function migratePassengerGender() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/gomate';
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const passengersCollection = db.collection('passengers');

    // Find all passengers without gender field
    const passengersWithoutGender = await passengersCollection.countDocuments({
      gender: { $exists: false },
    });

    console.log(
      `\n📊 Found ${passengersWithoutGender} passengers without gender field`,
    );

    if (passengersWithoutGender === 0) {
      console.log(
        '✅ All passengers already have gender field. No migration needed.',
      );
      await mongoose.connection.close();
      return;
    }

    // Update all passengers without gender to have gender = 'male'
    const result = await passengersCollection.updateMany(
      { gender: { $exists: false } },
      { $set: { gender: 'male' } },
    );

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   - Matched: ${result.matchedCount} passengers`);
    console.log(`   - Modified: ${result.modifiedCount} passengers`);
    console.log(`   - Default gender set to: 'male'`);

    // Verify the update
    const remainingWithoutGender = await passengersCollection.countDocuments({
      gender: { $exists: false },
    });

    if (remainingWithoutGender === 0) {
      console.log(
        '\n✅ Verification successful: All passengers now have gender field',
      );
    } else {
      console.log(
        `\n⚠️ Warning: ${remainingWithoutGender} passengers still missing gender field`,
      );
    }

    // Show sample of updated passengers
    const samplePassengers = await passengersCollection
      .find({})
      .limit(5)
      .toArray();
    console.log('\n📋 Sample of passengers (first 5):');
    samplePassengers.forEach((passenger, index) => {
      console.log(
        `   ${index + 1}. ${passenger.username} - Gender: ${passenger.gender}`,
      );
    });

    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migratePassengerGender();
