const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      email: String,
      role: String,
      permissions: Object
    }));
    
    const user = await User.findOne({ email: 'sub@gmail.com' });
    console.log('User found:', JSON.stringify(user, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkUser();
