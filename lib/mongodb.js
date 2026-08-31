import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, seedPromise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected successfully');
      return mongoose;
    });
  }
  cached.conn = await cached.promise;

  if (mongoose.models.User && !cached.seedPromise) {
    cached.seedPromise = seedDefaultAdmin();
  }

  if (cached.seedPromise) {
    await cached.seedPromise;
  }

  return cached.conn;
}

async function seedDefaultAdmin() {
  const adminEmail = 'admin@gmail.com';
  const hashedPassword = await bcrypt.hash('admin@987', 10);
  const result = await mongoose.models.User.updateOne(
    { email: adminEmail },
    {
      $setOnInsert: {
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      },
    },
    { upsert: true }
  );

  if (result.upsertedCount > 0) {
    console.log('Default admin seeded.');
  }
}

export default connectToDatabase;
