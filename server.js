const express = require("express");
const cors = require("cors");
const { readdirSync } = require("fs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

//database
const connect = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
    });
    console.log("connect to mongodb successfully");
  } catch (error) {
    console.log("connect to mongodb error", error);
  }
};
connect();
//route
readdirSync("./src/routes").map((route) =>
  app.use("/", require("./src/routes/" + route))
);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log("server is runnig...");
});
