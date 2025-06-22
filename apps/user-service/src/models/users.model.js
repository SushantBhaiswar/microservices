const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { SchemaNames } = require("/usr/src/libs");
const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
    },
    name: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.pre("update", async function (next) {
  const update = this.getUpdate(); // Access the update operation

  // Check if the password is modified in the update
  if (update.$set && update.$set.password) {
    // Hash the password
    const hashedPassword = await bcrypt.hash(update.$set.password, 8);

    // Update the update operation with the hashed password
    update.$set.password = hashedPassword;
  }

  next();
});

const User = mongoose.model(SchemaNames.Users, userSchema);
module.exports = User;
