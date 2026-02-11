const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const schema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, "Please Enter your name"],
  },
  email: {
    type: String,
    require: [true, "Please provide your Email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid Email"],
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  password: {
    type: String,
    require: [true, "Please provide your password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    require: [true, "Please conform your Password"],
    validate: {
      validator: function (el) {
        // Only works on .save() and .create()
        return this.password === el;
      },
      message: "Passwords do not match",
    },
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  refreshToken: {
    type: String,
    select: false, // Keep it hidden by default
  },
});

schema.pre("save", async function () {
  // 1) Only run this function if password was actually modified
  if (!this.isModified("password")) return; // Just return, don't call next()

  // 2) Hash the password with cost 12
  this.password = await bcrypt.hash(this.password, 12);

  // 3) Delete passwordConfirm field
  this.passwordConfirm = undefined;
});

schema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Todo_User = mongoose.model("Todo_User", schema);

module.exports = Todo_User;
