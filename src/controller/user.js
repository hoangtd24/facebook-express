const { validateEmail, validateLength } = require("../helpers/validation");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { createToken } = require("../helpers/tokens");
const { sendVerificationEmail, sendResetCode } = require("../helpers/mailer");
const Code = require("../models/Code");
const generateCode = require("../helpers/generateCode");
const Post = require("../models/Post");
const { default: mongoose } = require("mongoose");
const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");

const myOAuth2Client = new OAuth2Client(
  process.env.MAILING_ID,
  process.env.MAILING_SECRET
);
myOAuth2Client.setCredentials({
  refresh_token: process.env.MAILING_REFRESH,
});
exports.register = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      bYear,
      bMonth,
      bDay,
      gender,
    } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({
        message: "Email không tồn tại",
      });
    }
    const check = await User.findOne({ email });
    if (check) {
      return res.status(400).json({
        message: "Email này đã được đăng kí, vui lòng thử một email khác",
      });
    }
    if (!validateLength(first_name, 3, 30)) {
      return res.status(400).json({
        message: "Chiều dài chuỗi Họ nên từ 3-30",
      });
    }
    if (!validateLength(last_name, 3, 30)) {
      return res.status(400).json({
        message: "Chiều dài chuỗi Tên nên từ 3-30",
      });
    }
    if (!validateLength(password, 6, 40)) {
      return res.status(400).json({
        message: "Chiều dài của mật khẩu ít nhất phải 6 kí tự",
      });
    }

    const bcryptPassword = await bcrypt.hash(password, 12);
    let tempUsername = first_name + " " + last_name;
    const user = await new User({
      first_name,
      last_name,
      username: tempUsername,
      email,
      password: bcryptPassword,
      bYear,
      bMonth,
      bDay,
      gender,
    }).save();
    const emailVerificationToken = createToken({ id: user._id }, "30m");
    const url = `${process.env.BASE_URL}/activate/${emailVerificationToken}`;

    await sendVerificationEmail(user.email, user.username, url);
    const token = createToken({ id: user._id }, "1d");
    res.send({
      id: user._id,
      username: user.username,
      firstname: user.first_name,
      lastname: user.last_name,
      email: user.email,
      picture: user.picture,
      verified: user.verified,
      token: token,
      message:
        "Đăng kí thành công ! Kích hoạt email của bạn để bắt đầu sử dụng",
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.activateAccount = async (req, res) => {
  try {
    const { token } = req.body;
    const user = jwt.verify(token, process.env.TOKEN_SECRET);

    const check = await User.findById(user.id);
    if (check.verified) {
      return res.status(400).json({
        message: "Email đã được kích hoạt",
      });
    } else {
      await User.findByIdAndUpdate(user.id, { verified: true });
      return res.status(200).json({
        message: "Email vừa được kích hoạt thành công.",
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Email chưa được đăng kí",
      });
    } else {
      const check = await bcrypt.compare(password, user.password);
      if (check) {
        const token = createToken({ id: user._id }, "2d");
        res.send({
          id: user._id,
          username: user.username,
          firstname: user.first_name,
          lastname: user.last_name,
          email: user.email,
          picture: user.picture,
          cover: user.cover,
          verified: user.verified,
          token: token,
          message:
            "Đăng kí thành công ! Kích hoạt email của bạn để bắt đầu sử dụng",
        });
      } else {
        return res.status(400).json({
          message: "Mật khẩu không chính xác",
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.findUser = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.status(200).json({
        email: user.email,
        picture: user.picture,
      });
    } else {
      return res.status(400).json({
        message: "Tài khoản không tồn tại. Vui lòng thử lại!",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.sendResetPasswordCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({email: email})
    await Code.findOneAndRemove({ user: user._id });
    const code = generateCode(6);

    console.log(user)
    const saveCode = await new Code({
      code,
      user: user._id,
    }).save();
    await sendResetCode(email, user.name, code);
    return res.status(200).json({
      message: "Mã đã được gửi tới email của bạn",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.validateCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    const dbCode = await Code.findOne({ user: user._id });
    console.log(dbCode);
    if (dbCode.code === code) {
      return res.status(200).json({
        message: "ok",
      });
    } else {
      return res.status(400).json({
        message: "Code bạn nhập chưa chính xác",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  const { email, password } = req.body;
  const bcryptPassword = await bcrypt.hash(password, 12);
  await User.findOneAndUpdate(email, { password: bcryptPassword });
  return res.status(200).json({
    message: "ok",
  });
};

exports.getProfile = async (req, res) => {
  try {
    const { idUser } = req.params;
    const user = await User.findById(req.user.id);
    const profile = await User.findById(idUser).select("-password");
    const friendship = {
      friends: false,
      following: false,
      requestSent: false,
      requestReceived: false,
    };
    if (!profile) {
      return res.json({ ok: false });
    }
    if (
      user.friends.includes(profile._id) &&
      profile.friends.includes(user._id)
    ) {
      friendship.friends = true;
    }
    if (user.following.includes(profile._id)) {
      friendship.following = true;
    }
    if (user.requests.includes(profile._id)) {
      friendship.requestReceived = true;
    }
    if (profile.requests.includes(user._id)) {
      friendship.requestSent = true;
    }
    const posts = await Post.find({ user: profile._id })
      .populate("user")
      .populate("comments.commentBy", "username picture")
      .sort({ createdAt: -1 });
    await profile.populate("friends", "username picture");
    return res.status(200).json({ ...profile.toObject(), posts, friendship });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    const { url } = req.body;
    await User.findByIdAndUpdate(req.user.id, { picture: url });
    return res.json(url);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateCoverPicture = async (req, res) => {
  try {
    const { url } = req.body;
    await User.findByIdAndUpdate(req.user.id, { cover: url });
    return res.json(url);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateDetails = async (req, res) => {
  try {
    const { infos } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { details: infos },
      { new: true }
    );
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.addFriend = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        !receiver.requests.includes(sender._id) &&
        !receiver.friends.includes(sender._id)
      ) {
        await receiver.updateOne({
          $push: { requests: sender._id },
        });
        await receiver.updateOne({
          $push: { followers: sender._id },
        });
        await sender.updateOne({
          $push: { following: receiver._id },
        });
        res.json({ message: "friend request has been sent" });
      } else {
        return res.status(400).json({ message: "Already sent" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't send a request to yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.cancelRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        receiver.requests.includes(sender._id) &&
        !receiver.friends.includes(sender._id)
      ) {
        await receiver.updateOne({
          $pull: { requests: sender._id },
        });
        await receiver.updateOne({
          $pull: { followers: sender._id },
        });
        await sender.updateOne({
          $pull: { following: receiver._id },
        });
        res.json({ message: "you successfully canceled request" });
      } else {
        return res.status(400).json({ message: "Already Canceled" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't cancel a request to yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.follow = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        !receiver.followers.includes(sender._id) &&
        !sender.following.includes(receiver._id)
      ) {
        await receiver.updateOne({
          $push: { followers: sender._id },
        });

        await sender.updateOne({
          $push: { following: receiver._id },
        });
        res.json({ message: "follow success" });
      } else {
        return res.status(400).json({ message: "Already following" });
      }
    } else {
      return res.status(400).json({ message: "You can't follow yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.unfollow = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        receiver.followers.includes(sender._id) &&
        sender.following.includes(receiver._id)
      ) {
        await receiver.updateOne({
          $pull: { followers: sender._id },
        });

        await sender.updateOne({
          $pull: { following: receiver._id },
        });
        res.json({ message: "unfollow success" });
      } else {
        return res.status(400).json({ message: "Already not following" });
      }
    } else {
      return res.status(400).json({ message: "You can't unfollow yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.acceptRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const receiver = await User.findById(req.user.id);
      const sender = await User.findById(req.params.id);
      if (receiver.requests.includes(sender._id)) {
        await receiver.update({
          $push: { friends: sender._id, following: sender._id },
        });
        await sender.update({
          $push: { friends: receiver._id, followers: receiver._id },
        });
        await receiver.updateOne({
          $pull: { requests: sender._id },
        });
        res.json({ message: "friend request accepted" });
      } else {
        return res.status(400).json({ message: "Already friends" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't accept a request from  yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.unfriend = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        receiver.friends.includes(sender._id) &&
        sender.friends.includes(receiver._id)
      ) {
        await receiver.update({
          $pull: {
            friends: sender._id,
            following: sender._id,
            followers: sender._id,
          },
        });
        await sender.update({
          $pull: {
            friends: receiver._id,
            following: receiver._id,
            followers: receiver._id,
          },
        });

        res.json({ message: "unfriend request accepted" });
      } else {
        return res.status(400).json({ message: "Already not friends" });
      }
    } else {
      return res.status(400).json({ message: "You can't unfriend yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.deleteRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const receiver = await User.findById(req.user.id);
      const sender = await User.findById(req.params.id);
      if (receiver.requests.includes(sender._id)) {
        await receiver.update({
          $pull: {
            requests: sender._id,
            followers: sender._id,
          },
        });
        await sender.update({
          $pull: {
            following: receiver._id,
          },
        });

        res.json({ message: "delete request accepted" });
      } else {
        return res.status(400).json({ message: "Already deleted" });
      }
    } else {
      return res.status(400).json({ message: "You can't delete yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.search = async (req, res) => {
  try {
    const users = await User.find({ $text: { $search: req.params.value } })
      .select("username picture")
      .limit(5);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addToSearchHistory = async (req, res) => {
  try {
    const { searchUser } = req.body;
    const search = {
      user: searchUser,
      createdAt: new Date(),
    };
    const user = await User.findById(req.user.id);
    const check = user.search.find((x) => x.user.toString() === searchUser);
    if (check) {
      await User.updateOne(
        {
          _id: req.user.id,
          "search._id": check._id,
        },
        {
          $set: { "search.$.createdAt": new Date() },
        }
      );
    } else {
      await User.findByIdAndUpdate(req.user.id, {
        $push: {
          search,
        },
      });
    }
    res.json({ message: "ok" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSearchHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "search.user",
      "username picture"
    );
    user.search.sort((a, b) => b.createdAt - a.createdAt);
    res.json(user.search);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSearchHistory = async (req, res) => {
  try {
    const { idUser } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: {
          search: {
            user: idUser,
          },
        },
      },
      {
        new: true,
      }
    ).populate("search.user", "username picture");
    user.search.sort((a, b) => b.createdAt - a.createdAt);
    res.json(user.search);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInfoFriendPage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("friends", "username picture")
      .populate("requests", "username picture");
    const sendRequests = await User.find({
      requests: mongoose.Types.ObjectId(req.user.id),
    }).select("username picture");
    const allUsers = await User.find({});
    const newArr = allUsers.filter((user) => user._id != req.user.id);
    const info = {
      friends: user.friends,
      requests: user.requests,
      sends: sendRequests,
      people: newArr,
    };
    res.json(info);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
