const express = require("express");
const { reactPost, getReacts, unreactPost } = require("../controller/react");
const { authUser } = require("../middlwares/auth");

const router = express.Router();

router.post("/reactPost", authUser, reactPost);
router.post("/unreactPost", authUser, unreactPost);
router.get("/getReacts/:postId", authUser, getReacts);

module.exports = router;
