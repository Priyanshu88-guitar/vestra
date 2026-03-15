/**
 * ═══════════════════════════════════════════════════════
 * VESTRA – User Model (User.js)
 * Mongoose schema for user accounts.
 * ═══════════════════════════════════════════════════════
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,
      lowercase: true,
      trim:     true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select:    false, // Never return password in queries by default
    },
    profilePicture: {
      type:    String,
      default: null,
    },
    wardrobeCount: {
      type:    Number,
      default: 0,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

/* ─── PRE-SAVE HOOK: Hash password before storing ─── */
UserSchema.pre('save', async function (next) {
  // Only re-hash if password was modified
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (err) {
    next(err);
  }
});

/* ─── INSTANCE METHOD: Compare password ─── */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ─── INSTANCE METHOD: Return safe public profile ─── */
UserSchema.methods.toPublicJSON = function () {
  return {
    _id:           this._id,
    name:          this.name,
    email:         this.email,
    wardrobeCount: this.wardrobeCount,
    createdAt:     this.createdAt,
  };
};

module.exports = mongoose.model('User', UserSchema);
