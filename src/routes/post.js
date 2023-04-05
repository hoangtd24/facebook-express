const express = require("express");
const {
  createPost,
  getAllPost,
  comment,
  deletePost,
  getPost,
} = require("../controller/post");
const { authUser } = require("../middlwares/auth");

const router = express.Router();

router.post("/createPost", authUser, createPost);
router.delete("/deletePost/:id", authUser, deletePost);
router.get("/getPost/:id", authUser, getPost);
router.get("/getAllPost", authUser, getAllPost);
router.put("/comment", authUser, comment);

module.exports = router;
