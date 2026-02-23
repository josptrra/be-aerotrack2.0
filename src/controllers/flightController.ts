import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const jsonBigIntHandler = (key: string, value: any) => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
};

export const getFlights = async (req: Request, res: Response) => {
  try {
    // Definisi "Aktif": Pesawat yang data terakhirnya (lastSeen) diupdate kurang dari 2 menit lalu.
    // Kalo lebih dari itu, dianggap udah landing atau keluar dari bounds.
    const activeThreshold = new Date(Date.now() - 2 * 60 * 1000);

    const flights = await prisma.flight.findMany({
      where: {
        lastSeen: {
          gte: activeThreshold,
        },
      },
      include: {
        points: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    const jsonString = JSON.stringify(
      {
        message: "Success retrieving flight trails",
        count: flights.length,
        data: flights,
      },
      jsonBigIntHandler,
    );

    res.setHeader("Content-Type", "application/json");
    res.send(jsonString);
  } catch (error) {
    console.error("❌ Error getting flights:", error);
    res.status(500).json({ error: "Gagal mengambil data penerbangan" });
  }
};

// src/controllers/flightController.ts

export const getVisualizationData = async (req: Request, res: Response) => {
  try {
    // Kita ambil semua bandara
    const airports = await prisma.airport.findMany();

    // Kita hitung statistik untuk setiap bandara
    const stats = await Promise.all(
      airports.map(async (airport) => {
        // Hitung total data point di area bounds bandara tersebut
        const [north, south, west, east] = airport.bounds
          .split(",")
          .map(Number);

        const count = await prisma.flightPoint.count({
          where: {
            lat: { gte: south, lte: north },
            lon: { gte: west, lte: east },
          },
        });

        // Hitung jumlah maskapai unik di area tersebut
        const airlines = await prisma.flightPoint.findMany({
          where: {
            lat: { gte: south, lte: north },
            lon: { gte: west, lte: east },
          },
          distinct: ["flightId"], // Asumsi flightId unik per pesawat/maskapai
          select: { flight: { select: { callsign: true } } },
        });

        return {
          code: airport.code,
          airport: airport.name,
          city: airport.city,
          total_data: count,
          total_airlines: new Set(
            airlines.map((a) => a.flight?.callsign?.substring(0, 3)),
          ).size, // Ambil 3 huruf awal callsign
          last_update: new Date(),
        };
      }),
    );

    res.json({ data: stats }); // Kirim dalam properti 'data' agar sesuai Visualization.tsx
  } catch (error) {
    res.status(500).json({ error: "Gagal memuat data visualisasi" });
  }
};
