// Script to verify passenger password
// Usage: node verify-password.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Passenger ID to check
const PASSENGER_ID = '688c69f20653ec0f43df6e2c';
const TEST_PASSWORD = 'Ahmad123';

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/gomate-db';

async function verifyPassword() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the Passenger model
    const Passenger = mongoose.model(
      'Passenger',
      new mongoose.Schema({}, { strict: false }),
    );

    // Find the passenger
    const passenger = await Passenger.findById(PASSENGER_ID);

    if (!passenger) {
      console.error(`Passenger with ID ${PASSENGER_ID} not found`);
      process.exit(1);
    }

    console.log('\n=== Passenger Details ===');
    console.log(`ID: ${passenger._id}`);
    console.log(`Email: ${passenger.email}`);
    console.log(`Username: ${passenger.username}`);
    console.log(`Phone: ${passenger.phoneNumber || passenger.phone}`);
    console.log(
      `Password Hash: ${passenger.password ? passenger.password.substring(0, 20) + '...' : 'NO PASSWORD'}`,
    );
    console.log(`Role: ${passenger.role}`);

    if (!passenger.password) {
      console.error('\n❌ No password stored for this passenger!');
      process.exit(1);
    }

    // Test the password
    console.log(`\n=== Testing Password: "${TEST_PASSWORD}" ===`);
    const isMatch = await bcrypt.compare(TEST_PASSWORD, passenger.password);

    if (isMatch) {
      console.log('✅ Password matches!');
    } else {
      console.log('❌ Password does NOT match!');

      // Let's try to set it again
      console.log('\n=== Setting password again ===');
      const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
      passenger.password = hashedPassword;
      await passenger.save();
      console.log('✅ Password updated!');

      // Verify again
      const passenger2 = await Passenger.findById(PASSENGER_ID);
      const isMatch2 = await bcrypt.compare(TEST_PASSWORD, passenger2.password);
      console.log(
        `Verification after update: ${isMatch2 ? '✅ SUCCESS' : '❌ FAILED'}`,
      );
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

verifyPassword();
