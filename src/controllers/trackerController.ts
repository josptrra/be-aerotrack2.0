import { Request, Response } from "express";
import {
  startTracking,
  stopTracking,
  getTrackingStatus,
} from "../utils/scheduler";

export const setTrackingArea = (req: Request, res: Response) => {
  const { bounds } = req.body;

  if (!bounds) {
    return res.status(400).json({ message: "Parameter 'bounds' wajib diisi!" });
  }

  try {
    startTracking(bounds);

    res.json({
      message: "Tracking started successfully",
      active_bounds: bounds,
    });
  } catch (error: any) {
    console.warn("⚠️ Request ditolak: " + error.message);

    res.status(409).json({
      message: error.message || "Tracking sedang aktif. Stop dulu!",
    });
  }
};

export const stopTrackingArea = (req: Request, res: Response) => {
  stopTracking();
  res.json({ message: "Tracking stopped successfully" });
};

export const getStatus = (req: Request, res: Response) => {
  // Langsung ambil hasil dari scheduler
  const status = getTrackingStatus();

  // Kirim balik ke frontend
  res.json(status);
};
