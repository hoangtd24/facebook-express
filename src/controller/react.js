const mongoose = require("mongoose");
const React = require("../models/React");

exports.reactPost = async (req, res) => {
  try {
    const { postId, react } = req.body;

    const check = await React.findOne({
      post: postId,
      reactBy: mongoose.Types.ObjectId(req.user.id),
    });
    if (check == null) {
      await new React({
        react: react,
        post: postId,
        reactBy: req.user.id,
      }).save();
    } else {
      await React.findByIdAndUpdate(check._id, {
        react: react,
      });
    }
    res.status(200).json({
      message: "ok",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unreactPost = async (req, res) => {
  try {
    const { postId, react } = req.body;
    const check = await React.findOne({
      post: postId,
      reactBy: mongoose.Types.ObjectId(req.user.id),
    });
    await React.findByIdAndRemove(check._id);
    res.status(200).json({
      message: "ok",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReacts = async (req, res) => {
  try {
    const { postId } = req.params;
    const reacts = await React.find({ post: postId });
    const check = await React.findOne({
      post: postId,
      reactBy: mongoose.Types.ObjectId(req.user.id),
    });
    res.status(200).json({
      reacts: reacts,
      check: check?.react,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
