import cron from "node-cron";
import { sendExpiryNotifications } from "../controllers/sendExpiryNotifications/Notifications.js"; // path adjust karo

const startExpiryCronJob = () => {
  console.log("✅ Plan Expiry Cron Job Initialized");

  // Cron expression - daily at 9 AM
  cron.schedule(
    "0 */2 * * * *", // every 5 minutes // every 5 seconds
    async () => {
      try {
        console.log("⏳ Running Plan Expiry Notification Job...");

        // Dummy req/res objects for cron
        const dummyReq = {};
        const dummyRes = {
          status: (code) => ({
            json: (data) => console.log("Cron Response:", data),
          }),
        };

        await sendExpiryNotifications(dummyReq, dummyRes);

        console.log("✅ Plan Expiry Job completed");
      } catch (error) {
        console.error("❌ Plan Expiry Cron Job Error:", error.message);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    },
  );
};

export default startExpiryCronJob;
