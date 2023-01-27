const express = require("express");
const { uploadImages, getListImage } = require("../controller/upload");
const imageUpload = require("../middlwares/imageUpload");

const router = express.Router();

router.post("/uploadImages", imageUpload, uploadImages);
router.post("/getListImage", getListImage);
module.exports = router;
