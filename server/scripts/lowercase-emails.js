// server/scripts/lowercase-emails.js

// This script updates all user emails in the database to be lowercase.
// To run it, use the command: node server/scripts/lowercase-emails.js

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/userModel'); // Adjust path to your user model

const migrateEmailsToLowercase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in your .env file');
    }
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for migration...');

    const users = await User.find({});
    if (!users || users.length === 0) {
      console.log('No users found to migrate.');
      return;
    }

    console.log(`Found ${users.length} users. Starting migration...`);

    let updatedCount = 0;
    for (const user of users) {
      const originalEmail = user.email;
      const lowercasedEmail = originalEmail.toLowerCase();

      if (originalEmail !== lowercasedEmail) {
        user.email = lowercasedEmail;
        await user.save();
        updatedCount++;
        console.log(`Updated email for user ID ${user._id}: ${originalEmail} -> ${lowercasedEmail}`);
      }
    }

    if (updatedCount > 0) {
      console.log(`
Migration complete!
Successfully updated ${updatedCount} user emails to lowercase.
      `);
    } else {
      console.log('\nMigration complete! No emails required updating.');
    }

  } catch (error) {
    console.error('An error occurred during email migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

migrateEmailsToLowercase();
