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

// RUN GET (para navegador)
app.get("/api/opportunities/run", (req, res) => {
  res.json({
    ok: true,
    message: "RUN OK (GET)",
    data: [
      { id: "TEST-1", title: "Licitación prueba", score: 80 }
    ]
  });
});

// RUN POST
app.post("/api/opportunities/run", (req, res) => {
  res.json({
    ok: true,
    message: "RUN OK (POST)",
    data: [
      { id: "TEST-1", title: "Licitación prueba", score: 80 }
    ]
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server corriendo en puerto " + PORT);
});