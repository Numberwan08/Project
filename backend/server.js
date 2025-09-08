const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
const { readdirSync } = require("fs");
const path = require("path");

dotenv.config();

const app = express();
const port = 3000 || process.env.PORT;

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Connected Api sucessfully" });
});

readdirSync("./routes").map((name) => {
  try {
    console.log("./routes/" + name)
    app.use("/api", require("./routes/" + name));
  } catch (err) {
    console.error("Error loading route file:", name, err.message);
  }
});

app.listen(port, () => {
  console.log(`Sever is runnind on port http://localhost:${port}`);
});
