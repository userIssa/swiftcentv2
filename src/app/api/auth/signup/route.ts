import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Organization } from '@/models/Organization';
import { hashPassword, createSessionToken, serializeSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { name, email, password, businessName } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 400 });
    }

    const { salt, hash } = hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      salt,
      passwordHash: hash,
      role: 'admin',
    });

    // Automatically create a private, fresh workspace exclusively for this new user
    const firstName = name.trim().split(' ')[0] || 'My';
    const orgName = (businessName && businessName.trim()) || `${firstName}'s Workspace`;
    const prefix = firstName.slice(0, 3).toUpperCase() || 'INV';

    await Organization.create({
      name: orgName,
      email: normalizedEmail,
      ownerId: user._id,
      currency: 'USD',
      invoicePrefix: prefix,
      nextInvoiceNumber: 1001,
      quotePrefix: 'QTE',
      nextQuoteNumber: 1001,
      branding: {
        primaryColor: '#2563eb',
      },
    });

    const token = createSessionToken(user);

    const response = NextResponse.json({
      success: true,
      user: serializeSessionUser({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      }),
    }, { status: 201 });

    response.cookies.set('swiftcent_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
