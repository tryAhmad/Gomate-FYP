// Direct password update using MongoDB updateOne
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const PASSENGER_ID = '688c69f20653ec0f43df6e2c';
const NEW_PASSWORD = 'Ahmad123';
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/gomate-db';

async function directUpdate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('passengers');

    // Find current passenger
    const passenger = await collection.findOne({
      _id: new mongoose.Types.ObjectId(PASSENGER_ID),
    });

    if (!passenger) {
      console.error('Passenger not found!');
      process.exit(1);
    }

    console.log('\n=== Before Update ===');
    console.log('Email:', passenger.email);
    console.log(
      'Current password hash:',
      passenger.password ? passenger.password.substring(0, 30) + '...' : 'NONE',
    );

    // Hash the password
    console.log('\n=== Hashing password ===');
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    console.log('New hash:', hashedPassword.substring(0, 30) + '...');

    // Direct update
    console.log('\n=== Updating via MongoDB updateOne ===');
    const result = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(PASSENGER_ID) },
      { $set: { password: hashedPassword } },
    );

    console.log('Update result:', result);

    // Verify
    const updatedPassenger = await collection.findOne({
      _id: new mongoose.Types.ObjectId(PASSENGER_ID),
    });
    console.log('\n=== After Update ===');
    console.log(
      'New password hash:',
      updatedPassenger.password.substring(0, 30) + '...',
    );

    // Test the password
    console.log('\n=== Testing password ===');
    const isMatch = await bcrypt.compare(
      NEW_PASSWORD,
      updatedPassenger.password,
    );
    console.log(
      `Password "${NEW_PASSWORD}" matches: ${isMatch ? '✅ YES' : '❌ NO'}`,
    );

    if (isMatch) {
      console.log('\n✅✅✅ SUCCESS! Password updated and verified! ✅✅✅');
      console.log(`\nYou can now login with:`);
      console.log(`Email: ${updatedPassenger.email}`);
      console.log(`Password: ${NEW_PASSWORD}`);
    } else {
      console.log(
        '\n❌ Still not working. There might be an issue with bcrypt.',
      );
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

directUpdate();
