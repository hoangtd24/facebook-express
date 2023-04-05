const Post = require("../models/Post");
const User = require("../models/User");

exports.createPost = async (req, res) => {
  try {
    const post = await new Post(req.body).save();
    await post.populate("user", "username picture gender cover picture");
    res.status(200).json({
      post: post,
      message: "Tạo bài viết thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "username picture gender cover")
      .populate("comments.commentBy", "username picture");
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAllPost = async (req, res) => {
  try {
    const followingTemp = await User.findById(req.user.id).select("following");
    const following = followingTemp.following;

    const promises = following.map((user) => {
      return Post.find({ user: user })
        .populate("user", "username picture gender cover")
        .populate("comments.commentBy", "username picture")
        .sort({ createdAt: -1 })
        .limit(10);
    });

    const followingPosts = await (await Promise.all(promises)).flat();

    const userPosts = await Post.find({ user: req.user.id })
      .populate("user", "username picture gender cover")
      .populate("comments.commentBy", "username picture")
      .sort({ createdAt: -1 })
      .limit(10);

    followingPosts.push(...userPosts);
    followingPosts.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json(followingPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.comment = async (req, res) => {
  try {
    const { postId, text, image } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            comment: text,
            image: image,
            commentBy: req.user.id,
            commentAt: new Date(),
          },
        },
      },
      { new: true }
    ).populate("comments.commentBy");
    console.log(post.comments);
    res.status(200).json(post.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
