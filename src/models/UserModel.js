const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: String,
  middleName: String,
  lastName: String,
  address: String,
  profilePic: {
    type: String,
    default: '', // URL or path to the stored image
  },
  phoneNumber: {
    type: String,
    unique: true, // Assumes phone number is unique for each user
  },
  email: {
    type: String,
    unique: true, // Assumes email is unique for each user
  },
  profession: String,
  password: String, // Store hashed passwords only
  isLogin: {
    type: Boolean,
    default: false,
  },
  userAddedFrom: {
    type: mongoose.Schema.Types.ObjectId, // Assuming you're using MongoDB's ObjectId
    ref: 'User', // Reference to the same user model
    default: null, // Optional based on your requirements
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  // Hash the password with a salt round of 10
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
