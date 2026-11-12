import mongoose, { Document, Model, Schema } from 'mongoose';

export type UserRole = 'superadmin' | 'admin' | 'owner' | 'member';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    role: { type: String, enum: ['superadmin', 'admin', 'owner', 'member'], default: 'admin' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  (mongoose.models &&
  mongoose.models.User &&
  mongoose.models.User.schema.paths.lastLoginAt
    ? mongoose.models.User
    : null) ||
  (() => {
    if (mongoose.models && mongoose.models.User) {
      delete mongoose.models.User;
    }
    return mongoose.model<IUser>('User', UserSchema);
  })();

