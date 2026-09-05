import dns from 'dns';
import mongoose from 'mongoose';
import { config } from '../config/env';
import { User } from '../models/User';

// Configure public DNS servers to resolve MongoDB Atlas SRV records on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not permitted
}

async function testDatabase() {
  console.log('\n==================================================');
  console.log('🔌 TESTING MONGODB CONNECTION & DATA PERSISTENCE');
  console.log('==================================================\n');

  console.log('Target MongoDB URI:', config.mongoUri.replace(/:([^@]+)@/, ':****@'));
  console.log('Connecting to MongoDB Atlas...');

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`\n✅ [1/5] MongoDB Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   ReadyState: ${conn.connection.readyState} (1 = Connected)\n`);

    // Test writing data
    console.log('📝 [2/5] Testing Data Creation (WRITE)...');
    const testEmail = `test_connection_${Date.now()}@lifesaver.org`;
    const testUser = await User.create({
      name: 'Test Database User',
      email: testEmail,
      password: 'testPassword123!',
      phone: '+1234567890',
      bloodGroup: 'O+',
      isDonor: true,
      isAvailable: true,
      isVerified: true,
      location: {
        address: 'Test City Hospital',
        latitude: 40.7128,
        longitude: -74.006,
      },
    });

    console.log(`✅ [2/5] Test document written to database!`);
    console.log(`   Document ID: ${testUser._id}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Blood Group: ${testUser.bloodGroup}\n`);

    // Test reading data
    console.log('🔍 [3/5] Testing Data Retrieval (READ)...');
    const retrievedUser = await User.findById(testUser._id);
    if (!retrievedUser || retrievedUser.email !== testEmail) {
      throw new Error('Failed to retrieve written document');
    }
    console.log(`✅ [3/5] Successfully queried and verified document from MongoDB!\n`);

    // Test updating data
    console.log('🔄 [4/5] Testing Data Modification (UPDATE)...');
    retrievedUser.isAvailable = false;
    await retrievedUser.save();
    const updatedUser = await User.findById(testUser._id);
    if (updatedUser?.isAvailable !== false) {
      throw new Error('Failed to update document in database');
    }
    console.log(`✅ [4/5] Document successfully updated in MongoDB!\n`);

    // Clean up test document
    console.log('🧹 [5/5] Cleaning up test data (DELETE)...');
    await User.findByIdAndDelete(testUser._id);
    const checkDeleted = await User.findById(testUser._id);
    if (checkDeleted) {
      throw new Error('Failed to delete test document');
    }
    console.log(`✅ [5/5] Test document cleaned up cleanly!\n`);

    console.log('==================================================');
    console.log('🎉 ALL DATABASE CHECKS PASSED: Fully Connected & Working!');
    console.log('==================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ DATABASE TEST FAILED!');
    console.error('Error Details:', error.message);
    if (error.reason) console.error('Reason:', error.reason);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

testDatabase();
