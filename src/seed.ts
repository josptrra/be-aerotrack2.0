import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Data Bandara Dummy (Sesuai Screenshot Dashboard)
const airports = [
  {
    name: "Soekarno-Hatta International Airport",
    code: "CGK",
    city: "Jakarta",
    lat: -6.1256,
    lon: 106.6558,
    bounds: "-6.0,-6.3,106.5,106.8",
  },
  {
    name: "Ngurah Rai International Airport",
    code: "DPS",
    city: "Denpasar, Bali",
    lat: -8.7467,
    lon: 115.1675,
    bounds: "-8.6,-8.9,115.0,115.3",
  },
  {
    name: "Abdul Rachman Saleh Airport",
    code: "MLG",
    city: "Malang",
    lat: -7.9264,
    lon: 112.7126,
    bounds: "-7.8,-8.0,112.6,112.8",
  },
  {
    name: "Sultan Hasanuddin Airport",
    code: "UPG",
    city: "Makassar",
    lat: -5.0615,
    lon: 119.554,
    bounds: "-4.9,-5.2,119.4,119.7",
  },
  {
    name: "Kualanamu International Airport",
    code: "KNO",
    city: "Medan",
    lat: 3.6424,
    lon: 98.8853,
    bounds: "3.8,3.5,98.7,99.0",
  },
  {
    name: "Husein Sastranegara International Airport",
    code: "BDO",
    city: "Bandung",
    lat: -6.9006,
    lon: 107.5764,
    bounds: "-6.8,-7.0,107.5,107.7",
  },
];

// Data Pesawat Dummy
const flights = [
  { fr24_id: "dummy_1", hex: "8A02C2", callsign: "GIA123", source: "ADSB" }, // Garuda
  { fr24_id: "dummy_2", hex: "8A05F1", callsign: "LNI456", source: "ADSB" }, // Lion
  { fr24_id: "dummy_3", hex: "8A01A1", callsign: "BTK789", source: "ADSB" }, // Batik
  { fr24_id: "dummy_4", hex: "8A09B2", callsign: "QZ202", source: "ADSB" }, // AirAsia
  { fr24_id: "dummy_5", hex: "8A08C3", callsign: "CTV999", source: "MLAT" }, // Citilink
];

async function main() {
  console.log("🌱 Mulai Seeding Data Dummy...");

  // 1. Reset Data (Opsional: Hapus komentar jika ingin db bersih dulu)
  // await prisma.flightPoint.deleteMany();
  // await prisma.flight.deleteMany();
  // await prisma.airport.deleteMany();

  // 2. Insert Bandara
  console.log("✈️  Memasukkan Data Bandara...");
  for (const airport of airports) {
    await prisma.airport.upsert({
      where: { code: airport.code },
      update: {},
      create: airport,
    });
  }

  // 3. Insert Flight Header
  console.log("🚁 Memasukkan Data Pesawat...");
  for (const flight of flights) {
    await prisma.flight.upsert({
      where: { fr24_id: flight.fr24_id },
      update: { lastSeen: new Date() },
      create: {
        fr24_id: flight.fr24_id,
        hex: flight.hex,
        callsign: flight.callsign,
        source: flight.source,
        firstSeen: new Date(new Date().setDate(new Date().getDate() - 3)), // Terlihat sejak 3 hari lalu
      },
    });
  }

  // 4. Generate 500 Flight Points
  console.log("📍 Mengenerate 500 Data Flight Points...");
  const dataPoints = [];

  for (let i = 0; i < 500; i++) {
    // Pilih pesawat acak
    const randomFlight = flights[Math.floor(Math.random() * flights.length)];
    // Pilih lokasi bandara acak (supaya koordinatnya valid masuk filter geo-fencing)
    const randomAirport = airports[Math.floor(Math.random() * airports.length)];

    // Random Offset (Biar seolah-olah pesawat bergerak di sekitar bandara)
    // Offset sekitar +/- 0.05 derajat (~5km)
    const randomLat = randomAirport.lat + (Math.random() * 0.1 - 0.05);
    const randomLon = randomAirport.lon + (Math.random() * 0.1 - 0.05);

    // Random Timestamp (Antara hari ini sampai 3 hari lalu)
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 3);
    const randomTime = new Date(
      past.getTime() + Math.random() * (now.getTime() - past.getTime())
    );

    dataPoints.push({
      flightId: randomFlight.fr24_id,
      lat: randomLat,
      lon: randomLon,
      track: Math.floor(Math.random() * 360),
      alt: Math.floor(Math.random() * 30000) + 1000, // 1000 - 31000 feet
      gspeed: Math.floor(Math.random() * 500) + 200, // Speed 200-700
      vspeed: Math.floor(Math.random() * 200) - 100, // Naik/Turun dikit
      squawk: "7001",
      timestamp: randomTime,
    });
  }

  // Insert Bulk (Lebih cepat pakai createMany)
  await prisma.flightPoint.createMany({
    data: dataPoints,
  });

  console.log("✅ Seeding Selesai! Database terisi.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
