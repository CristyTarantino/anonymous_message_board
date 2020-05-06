const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 13;

const ThreadSchema = new mongoose.Schema(
  {
    board: { type: String, required: true },
    text: { type: String, required: true },
    reported: { type: Boolean, required: true, default: false },
    delete_password: { type: String, required: true },
    replycount: { type: Number, default: 0 },
    replies: [Object]
  },
  {
    timestamps: {
      createdAt: "created_on",
      updatedAt: "bumped_on"
    }
  }
);

ThreadSchema.pre("save", function(next) {
  var thread = this;
  // Generate a password hash when the password changes (or a new password)
  if (!thread.isModified("delete_password")) return next();
  // Generate a salt
  bcrypt.genSalt(SALT_ROUNDS, function(err, salt) {
    if (err) return next(err);
    // Combining Salt to Generate New Hash
    bcrypt.hash(thread.delete_password, salt, function(err, hash) {
      if (err) return next(err);
      // Overwriting plaintext passwords with hash
      thread.delete_password = hash;
      next();
    });
  });
});

module.exports = mongoose.model("Threads", ThreadSchema);
