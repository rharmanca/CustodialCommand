
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for parsing JSON
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toLocaleTimeString()} [express] ${req.method} ${req.url} ${res.statusCode} in ${duration}ms`);
  });
  
  next();
});

// ✅ API Routes - MUST come before static file serving
app.get("/api/health", (req, res) => {
  console.log("Health check endpoint called");
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get("/api/concerns", (req, res) => {
  console.log("Concerns endpoint called");
  res.json([
    { id: 1, title: "Spilled coffee in hallway", status: "open", priority: "medium" },
    { id: 2, title: "Broken light in classroom 204", status: "closed", priority: "high" },
    { id: 3, title: "Restroom needs supplies", status: "open", priority: "low" },
  ]);
});

app.get("/api/inspections", (req, res) => {
  console.log("Inspections endpoint called");
  res.json([
    { 
      id: 1, 
      type: "single-area", 
      date: "2024-01-15", 
      school: "Lincoln Elementary",
      room: "Classroom 101",
      status: "completed"
    },
    { 
      id: 2, 
      type: "building", 
      date: "2024-01-16", 
      school: "Washington Middle School",
      status: "in-progress"
    },
    { 
      id: 3, 
      type: "single-area", 
      date: "2024-01-17", 
      school: "Jefferson High School",
      room: "Gymnasium",
      status: "pending"
    },
  ]);
});

// ✅ Serve static files from dist folder
app.use(express.static(path.join(__dirname, "../dist")));

// ✅ Client-side routing - only for non-API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api")) {
    console.log(`API endpoint not found: ${req.path}`);
    return res.status(404).json({ 
      error: "API endpoint not found",
      path: req.path,
      availableEndpoints: ["/api/health", "/api/concerns", "/api/inspections"]
    });
  }

  // Serve React app for all other routes
  console.log(`Serving React app for route: ${req.path}`);
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🏫 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, "../dist")}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
