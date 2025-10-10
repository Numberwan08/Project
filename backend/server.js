const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
const { readdirSync } = require("fs");
const path = require("path");

dotenv.config();

const app = express();
// Prefer PORT from environment, default to 3000
const port = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Connected Api sucessfully" });
});

// Load all route modules from the routes directory regardless of CWD
const routesDir = path.join(__dirname, "routes");
readdirSync(routesDir).forEach((name) => {
  try {
    const routePath = path.join(routesDir, name);
    app.use("/api", require(routePath));
    if (process.env.NODE_ENV !== "test") {
      console.log(`Loaded route: ${name}`);
    }
  } catch (err) {
    console.error("Error loading route file:", name, err.message);
  }
});

app.listen(port, () => {
  console.log(`Sever is runnind on port http://localhost:${port}`);
});
