import express from "express";

const app = express();

app.use(express.json());

// root
app.get("/", (req, res) => {
  res.send("API OK");
});

// health
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// 👉 TEST endpoint (simula pipeline)
app.post("/api/opportunities/run", async (req, res) => {
  try {
    // simulado por ahora
    const data = [
      {
        id: "TEST-1",
        title: "Mantención HVAC hospital",
        entity: "MINSAL",
        region: "Biobío",
        amount: 45000000,
        score: 75,
        priority: "alta"
      },
      {
        id: "TEST-2",
        title: "Construcción sala eléctrica",
        entity: "CODELCO",
        region: "Antofagasta",
        amount: 120000000,
        score: 85,
        priority: "alta"
      }
    ];

    res.json({
      ok: true,
      count: data.length,
      data
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("API corriendo en puerto " + PORT);
});