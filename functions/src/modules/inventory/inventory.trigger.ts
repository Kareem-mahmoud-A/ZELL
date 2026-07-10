import { onSchedule } from "firebase-functions/v2/scheduler";
import { InventoryService } from "@zell/database";

export const releaseExpiredReservationsCron = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "UTC",
    memory: "256MiB",
  },
  async () => {
    try {
      const releasedCount = await InventoryService.releaseExpiredReservations();
      console.log(
        `Successfully completed expired stock reservations cleanup. Released: ${releasedCount}`
      );
    } catch (error) {
      console.error("Error in releaseExpiredReservations scheduled function:", error);
    }
  }
);
