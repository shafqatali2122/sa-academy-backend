// backend/models/userModel.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    // --- THIS IS THE UPDATED SECTION ---
    // I have updated the roles to match your 3 new hires + you
    role: {
      type: String,
      enum: [
        'User',
        'SuperAdmin',
        'AdmissionsAdmin',
        'ContentAdmin',
        'AudienceAdmin',
      ],
      default: 'User', // Default new signups to 'User'
    },
    // --- END OF UPDATED SECTION ---
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Middleware to hash the password before saving a new user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with the hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;