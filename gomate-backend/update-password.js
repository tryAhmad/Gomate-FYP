// Script to update passenger password
// Usage: node update-password.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Passenger ID to update
const PASSENGER_ID = '688c69f20653ec0f43df6e2c';
const NEW_PASSWORD = 'Ahmad123';

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/gomate-db';

async function updatePassword() {
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

    console.log(`Found passenger: ${passenger.email || passenger.username}`);

    // Hash the new password
    console.log('Hashing new password...');
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    // Update the password
    passenger.password = hashedPassword;
    await passenger.save();

    console.log('✅ Password updated successfully!');
    console.log(`Email: ${passenger.email}`);
    console.log(`New Password: ${NEW_PASSWORD}`);
  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

updatePassword();
