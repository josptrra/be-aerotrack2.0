import { fetchAndStoreFlights } from "../services/flightService";

// SETTING INTERVAL
const ACTIVE_INTERVAL = 20 * 1000; // 20 Detik (kalo ada pesawat)
const RELAXED_INTERVAL = 2 * 60 * 1000; // 2 Menit

let timer: NodeJS.Timeout | null = null; // Pengganti variable 'task' cron
let currentBounds: string = "";
let isRunning = false;

// Fungsi Loop Logic
const runSchedulerLoop = async () => {
  if (!isRunning) return;

  try {
    const flightCount = await fetchAndStoreFlights(currentBounds);
    // Logic: Kalau ada pesawat (> 0), gas 20 detik. Kalau kosong, ttep 2 menit.
    const nextInterval = flightCount > 0 ? ACTIVE_INTERVAL : RELAXED_INTERVAL;

    console.log(`⏱️  Next update in ${nextInterval / 1000} seconds...`);

    // set timer untuk putaran selanjutnya (Recursive)
    timer = setTimeout(runSchedulerLoop, nextInterval);
  } catch (error) {
    console.error("Scheduler Error:", error);
    // kalo error balik ke interval 2 menit.
    timer = setTimeout(runSchedulerLoop, RELAXED_INTERVAL);
  }
};

// logic biar gbs narik lebih dari 1 bandara atau param bounds
export const startTracking = async (bounds: string) => {
  if (isRunning) {
    throw new Error("Tracking sedang berjalan. Silahkan stop instancenya dulu");
  }

  currentBounds = bounds;
  isRunning = true;
  console.log(`🚀 Memulai Adaptive Tracking untuk bounds: ${bounds}`);

  runSchedulerLoop();
};

export const stopTracking = () => {
  if (isRunning) {
    isRunning = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    currentBounds = "";
    console.log("🛑 Tracking dihentikan total.");
  } else {
    console.log("⚠️ Tidak ada tracking yang berjalan.");
  }
};

export const getTrackingStatus = () => {
  return {
    message: "Success retrieving tracking status",
    data: {
      isTracking: isRunning, // Sesuaikan dengan variabel 'isRunning' di atas
      activeBounds: currentBounds, // Sesuaikan dengan variabel 'currentBounds' di atas
    },
  };
};
