// backend/models/userModel.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // ✅ Added for password reset

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    // --- ROLES SECTION (UNCHANGED STRUCTURE) ---
    role: {
      type: String,
      enum: [
        'User',
        'SuperAdmin',
        'AdmissionsAdmin',
        'ContentAdmin',
        'AudienceAdmin',
      ],
      default: 'User',
    },

    // --- NEW FIELDS FOR PASSWORD RESET ---
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

// ✅ Middleware: Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ NEW METHOD: Create Password Reset Token
userSchema.methods.createPasswordResetToken = function () {
  // 1. Create a random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // 2. Hash the token and store it
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 3. Set expiry to 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // 4. Return plain token (to send via email)
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
