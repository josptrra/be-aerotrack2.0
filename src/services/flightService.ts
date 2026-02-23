import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const FR24_TOKEN = process.env.FR24_API_TOKEN;

export const fetchAndStoreFlights = async (bounds: string): Promise<number> => {
  try {
    if (!FR24_TOKEN) {
      console.error("❌ Token FR24 tidak ditemukan!");
      return 0;
    }

    const config = {
      method: "get",
      url: "https://fr24api.flightradar24.com/api/live/flight-positions/light",
      headers: {
        Accept: "application/json",
        "Accept-Version": "v1",
        Authorization: `Bearer ${FR24_TOKEN}`,
      },
      params: {
        bounds: bounds,
      },
    };

    console.log(`📡 Hitting FR24...`); // log biar tau jalan apa ngga

    const response = await axios.request(config);
    const flightData = response.data.data;

    // kalo kosong, return 0 biar scheduler ttep stay 2 menit sekali
    if (!flightData || flightData.length === 0) {
      console.log("💤 Tidak ada pesawat.");
      return 0;
    }

    await prisma.$transaction(async (tx) => {
      for (const flight of flightData) {
        await tx.flight.upsert({
          where: { fr24_id: flight.fr24_id },
          update: { lastSeen: new Date() },
          create: {
            fr24_id: flight.fr24_id,
            hex: flight.hex,
            callsign: flight.callsign,
            source: flight.source,
            firstSeen: new Date(),
          },
        });

        const exists = await tx.flightPoint.findFirst({
          where: {
            flightId: flight.fr24_id,
            timestamp: new Date(flight.timestamp),
          },
        });

        if (!exists) {
          await tx.flightPoint.create({
            data: {
              flightId: flight.fr24_id,
              lat: flight.lat,
              lon: flight.lon,
              track: flight.track,
              alt: flight.alt,
              gspeed: flight.gspeed,
              vspeed: flight.vspeed,
              squawk: String(flight.squawk),
              timestamp: new Date(flight.timestamp),
            },
          });
        }
      }
    });

    console.log(`✅ ${flightData.length} pesawat aktif. Mode Agresif!`);

    return flightData.length;
  } catch (error: any) {
    console.error("❌ Error fetching:", error.message);
    return 0;
  }
};
