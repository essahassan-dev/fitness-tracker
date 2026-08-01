require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const SUPER_ADMIN = {
  name: 'Super Admin',
  email: 'superadmin@fitstack.app',
  password: 'SuperAdmin@123',
  role: 'super_admin',
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: SUPER_ADMIN.email });
    if (existing) {
      if (existing.role !== 'super_admin') {
        existing.role = 'super_admin';
        await existing.save({ validateBeforeSave: false });
        console.log('Existing user promoted to super_admin');
      } else {
        console.log('Super Admin already exists');
      }
    } else {
      await User.create(SUPER_ADMIN);
      console.log('Super Admin created!');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Super Admin Credentials');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Email   : ${SUPER_ADMIN.email}`);
    console.log(`  Password: ${SUPER_ADMIN.password}`);
    console.log(`  Role    : super_admin`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
