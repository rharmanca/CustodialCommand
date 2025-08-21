import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ API Routes - MUST come before static file serving
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/concerns", (req, res) => {
  res.json([
    { id: 1, title: "Test Concern 1", status: "open" },
    { id: 2, title: "Test Concern 2", status: "closed" },
  ]);
});

app.get("/api/inspections", (req, res) => {
  res.json([
    { id: 1, type: "single-area", date: "2024-01-15" },
    { id: 2, type: "building", date: "2024-01-16" },
  ]);
});

// ✅ Serve static files from dist folder
app.use(express.static(path.join(__dirname, "../dist")));

// ✅ Client-side routing - only for non-API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  // Serve React app for all other routes
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
