const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;

const reactSchema = new mongoose.Schema({
  react: {
    type: String,
    enum: ["like", "haha", "sad", "love", "angry", "wow"],
    required: true,
  },
  post: {
    type: ObjectId,
    ref: "Post"
  },
  reactBy: {
    type: ObjectId,
    ref: "User"
  }
});

module.exports = mongoose.model("React", reactSchema);
