require("dotenv").config();

const express = require("express");
const { scrapeOpportunities } = require("../engine/dist/scraper");

const app = express();

app.use(express.json());

// ROOT
app.get("/", (req, res) => {
  res.send("API OK");
});

// DEBUG
console.log("API_KEY:", process.env.MP_API_KEY);

// RUN
app.get("/api/opportunities/run", async (req, res) => {
  try {
    const data = await scrapeOpportunities();

    res.json({
      ok: true,
      count: data.length,
      data
    });
  } catch (e) {
    res.json({
      ok: false,
      error: e.message
    });
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("API corriendo en puerto " + PORT);
});