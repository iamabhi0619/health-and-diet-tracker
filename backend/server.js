import express from "express";
import ApiError, { errorHandler } from "./middleware/error-handler.js";
import cors from "cors";
import v1Router from "./routes/v1.js";
import connectDB from "./config/mongo-db.js";
import config from "./config/index.js";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(cookieParser());


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes (before static files)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/v1", v1Router);

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Serve frontend for all non-API routes (SPA fallback)
app.use((req, res, next) => {
  // If it's an unmatched API route, return 404
  if (req.path.startsWith('/v1/')) {
    return next(
      new ApiError(
        404,
        "Route not found",
        "NOT_FOUND",
        `The requested URL ${req.originalUrl} was not found on this server.`
      )
    );
  }
  // Otherwise serve the frontend index.html for client-side routing
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Error handler: log and delegate to the reusable errorHandler
app.use((err, req, res, next) => {
  console.error(err.stack);
  errorHandler(err, req, res, next);
});

// Start server
const PORT = config.PORT || 5050;

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${PORT}`);
});
