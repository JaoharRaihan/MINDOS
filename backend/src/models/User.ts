import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken {
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  preferredName?: string;
  languagePreference: 'en' | 'bn' | 'banglish';
  onboardingCompleted: boolean;
  communicationTone?: 'gentle' | 'practical' | 'casual';
  primaryFocusAreas?: string[];
  baselineSupportType?: 'micro_actions' | 'conversation' | 'journaling' | 'pattern_tracking';
  privacySettings?: {
    aiMemoryEnabled: boolean;
    allowAnalytics: boolean;
  };
  refreshTokens: IRefreshToken[];
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): Partial<IUser>;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
  tokenHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  userAgent: { type: String },
  ipAddress: { type: String },
});

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    preferredName: {
      type: String,
      trim: true,
    },
    languagePreference: {
      type: String,
      enum: ['en', 'bn', 'banglish'],
      default: 'banglish',
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    communicationTone: {
      type: String,
      enum: ['gentle', 'practical', 'casual'],
      default: 'practical',
    },
    primaryFocusAreas: [{
      type: String,
    }],
    baselineSupportType: {
      type: String,
      enum: ['micro_actions', 'conversation', 'journaling', 'pattern_tracking'],
      default: 'micro_actions',
    },
    privacySettings: {
      aiMemoryEnabled: { type: Boolean, default: true },
      allowAnalytics: { type: Boolean, default: true },
    },
    refreshTokens: [RefreshTokenSchema],
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.toSafeObject = function (): Partial<IUser> {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.refreshTokens;
  delete user.__v;
  return user;
};

export const User = mongoose.model<IUser>('User', UserSchema);
