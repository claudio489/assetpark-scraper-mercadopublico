const express = require("express");

const app = express();

app.use(express.json());

// ROOT
app.get("/", (req, res) => {
  res.send("API OK");
});

// HEALTH
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// RUN (POST)
app.post("/api/opportunities/run", (req, res) => {
  res.json({
    ok: true,
    message: "RUN OK",
    count: 1,
    data: [
      {
        id: "TEST-1",
        title: "Licitacion de prueba",
        entity: "MINSAL",
        region: "Biobio",
        amount: 50000000,
        score: 80,
        priority: "alta"
      }
    ]
  });
});

// RUN (GET para navegador)
app.get("/api/opportunities/run", (req, res) => {
  res.json({
    ok: true,
    message: "RUN OK GET",
    count: 1,
    data: [
      {
        id: "TEST-1",
        title: "Licitacion de prueba",
        score: 80
      }
    ]
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("API corriendo en puerto " + PORT);
});