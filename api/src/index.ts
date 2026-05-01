import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API OK 🚀");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(🚀 API corriendo en puerto );
});
