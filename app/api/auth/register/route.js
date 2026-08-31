import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { name, password } = body;
    const email = body.email?.trim().toLowerCase();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ message: 'Please provide a valid email address' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return NextResponse.json({ message: 'User created successfully', user: { id: user._id, email: user.email, name: user.name } }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create user', error: error.message }, { status: 500 });
  }
}
