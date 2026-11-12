import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/mongodb';
import { hashPassword } from '../src/lib/auth';
import { User } from '../src/models/User';

function loadEnvLocalIfPresent() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function readFlag(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return undefined;
}

async function main() {
  loadEnvLocalIfPresent();

  const email = (readFlag('--email') || process.env.PLATFORM_ADMIN_EMAIL || '')
    .trim()
    .toLowerCase();
  const password = readFlag('--password') || process.env.PLATFORM_ADMIN_PASSWORD || '';
  const name = (readFlag('--name') || process.env.PLATFORM_ADMIN_NAME || 'Platform Admin').trim();

  if (!email) {
    console.error('Missing admin email. Pass --email <email> or set PLATFORM_ADMIN_EMAIL.');
    process.exit(1);
  }

  await connectToDatabase();

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'superadmin';
    if (name) existing.name = name;
    if (password) {
      if (password.length < 8) {
        console.error('Password must be at least 8 characters long.');
        process.exit(1);
      }
      const { salt, hash } = hashPassword(password);
      existing.salt = salt;
      existing.passwordHash = hash;
    }
    await existing.save();
    console.log(`Updated existing account ${email} to superadmin.`);
  } else {
    if (!password || password.length < 8) {
      console.error(
        'Missing or too short password (min 8 chars). Pass --password <pw> or set PLATFORM_ADMIN_PASSWORD.'
      );
      process.exit(1);
    }
    const { salt, hash } = hashPassword(password);
    await User.create({
      name,
      email,
      salt,
      passwordHash: hash,
      role: 'superadmin',
    });
    console.log(`Created new superadmin account for ${email}.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed to provision admin user:', err);
  process.exit(1);
});

