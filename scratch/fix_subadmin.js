const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function fixUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      email: String,
      role: String,
      permissions: Object
    }));
    
    await User.updateOne(
      { email: 'sub@gmail.com' },
      { 
        $set: { 
          'permissions.products.view': true,
          'permissions.dashboard.view': true,
          'permissions.orders.view': true,
          'permissions.categories.view': true
        } 
      }
    );
    console.log('User updated');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

fixUser();
