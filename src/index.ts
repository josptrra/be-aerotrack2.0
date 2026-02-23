import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { login, registerManual } from "./controllers/authController";
import { getFlights } from "./controllers/flightController";
import {
  setTrackingArea,
  stopTrackingArea,
  getStatus,
} from "./controllers/trackerController";
import {
  getAirports,
  addAirport,
  getDashboardStats,
} from "./controllers/dashboardController";
import { exportFlightData } from "./controllers/exportController";
import { getVisualizationData } from "./controllers/flightController";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Aerotrack Backend Ready ✈️");
});

// Auth
app.post("/api/login", login);
app.post("/api/register-seed", registerManual);

// Flight Data
app.get("/api/flights", getFlights);

// CONTROL TRACKING
app.get("/api/track/status", getStatus);
app.post("/api/track/start", setTrackingArea);
app.post("/api/track/stop", stopTrackingArea);

// --- Routes Dashboard & Bandara ---

// 1. Buat ngisi Card Bandara di dashboard
app.get("/api/airports", getAirports);

// 2. Buat tombol "+ Tambah Bandara"
app.post("/api/airports", addAirport);

// 3. Buat Counter Stats (Total Bandara & Total Data)
app.get("/api/dashboard/stats", getDashboardStats);

app.get("/api/dashboard/visualization", getVisualizationData);

app.post("/api/export", exportFlightData);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("💤 Menunggu perintah tracking dari frontend...");
});
