import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- SECTION 1: MANAJEMEN BANDARA ---

// GET: Ambil semua daftar bandara buat ditampilkan di Card Dashboard
export const getAirports = async (req: Request, res: Response) => {
  try {
    const airports = await prisma.airport.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: airports });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data bandara" });
  }
};

export const addAirport = async (req: Request, res: Response) => {
  const { name, code, city, bounds, lat, lon } = req.body;

  // simple validation (males validate di FE)
  if (!name || !code || !bounds || !lat || !lon) {
    return res.status(400).json({ message: "Data tidak lengkap!" });
  }

  try {
    const newAirport = await prisma.airport.create({
      data: {
        name,
        code: code.toUpperCase(), // Uppercase only (CGK)
        city,
        bounds,
        lat: parseFloat(lat), // numeric/float only
        lon: parseFloat(lon),
      },
    });
    res.status(201).json(newAirport);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Gagal menambah bandara. Pastikan kode bandara unik." });
  }
};

// --- Section 2: COUNTER / STATISTIK ---

// GET: Statistik Global Dashboard
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalAirports = await prisma.airport.count();
    const totalFlightPoints = await prisma.flightPoint.count();
    res.json({
      data: {
        // Bungkus dengan key 'data'
        total_airports: totalAirports,
        total_data_points: totalFlightPoints,
      },
    });
  } catch (error) {
    console.error("Error stats:", error);
    res.status(500).json({ error: "Gagal mengambil statistik" });
  }
};
