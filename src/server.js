import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import path from "path";
import fs from "fs";
import http from "http";
import { Server } from "socket.io";
import businessUserRoutes from "./routes/SuperAdmin/Auth/Bussiness_User.js";
import driverRoutes from "./routes/User/Drivers/Driver.js";
import driverLicenseRoutes from "./routes/User/Drivers/DriverLicense.js";
import medicalCertificateRoutes from "./routes/User/Drivers/MedicalCertificate.js";
import payrollRoutes from "./routes/User/Drivers/PayrollRecord.js";
import equipmentRoutes from "./routes/User/Equipment/Equipment.js";
import maintenanceRoutes from "./routes/User/Equipment/maintenanceDue.js";
import WorkshopRoutes from "./routes/User/Equipment/Workshop.js";
import addressRoutes from "./routes/Address.js";
import partReplacementRoutes from "./routes/User/Equipment/PartReplacement.js";
import tyreReplacementRoutes from "./routes/User/Equipment/TyreReplacement.js";
import expenseRoutes from "./routes/User/Equipment/Expense.js";
import fleetUserAuthRoutes from "./routes/SuperAdmin/Auth/Fleet_User.js";
import fleetSubAdminRoutes from "./routes/SuperAdmin/Fleetsubadmin.js";
import emailOtpRoutes from "./routes/SuperAdmin/Email/EmailOtp.js";
import forgetpassRoutes from "./routes/SuperAdmin/Email/forgetpass.js";
import driverStatusRoutes from "./routes/User/Drivers/Driverstatusroutes.js";
import branchRoutes from "./routes/SuperAdmin/Auth/Branch.js";
import workOrderRoutes from "./routes/User/Work_Order_Trip/WorkOrder.js";
import customerRoutes from "./routes/User/Work_Order_Trip/Customer.js";
import serviceTypeRoutes from "./routes/User/Work_Order_Trip/ServiceType.js";
import maintenanceHistoryRoutes from "./routes/User/Equipment/MaintenanceHistory.js";
import tripRoutes from "./routes/User/Work_Order_Trip/Trip.js";
import tripRoute from "./routes/User/Work_Order_Trip/TripRoute.js";
import hotelRoutes from "./routes/User/Work_Order_Trip/Hotel.js";
import tripExpenseRoutes from "./routes/User/Work_Order_Trip/Expense.js";
import inspectionQuestionRoutes from "./routes/User/Work_Order_Trip/EquipmentQuestion.js";
import ispCategoryRoutes from "./routes/User/Work_Order_Trip/Isp_Category.js";
import insp_QuestionRoutes from "./routes/User/Work_Order_Trip/Insp_Question.js";
import driverEmailOtpRoutes from "./routes/SuperAdmin/Email/Driver/EmailOtp.js";
import driverForgetPasswordRoutes from "./routes/SuperAdmin/Email/Driver/forgetpass.js";

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("public/uploads"));

app.get("/api/private-file", (req, res) => {
  const { filePath } = req.query;

  if (!filePath) {
    return res
      .status(400)
      .json({ success: false, message: "filePath is required" });
  }

  const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, "");
  const absPath = path.join(process.cwd(), safePath);
  const allowedBase = path.join(process.cwd(), "private");

  if (!absPath.startsWith(allowedBase)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  res.sendFile(absPath);
});

app.use("/api/branches", branchRoutes);

///// Trip Routes
app.use("/api/trip-routes", tripRoute);
app.use("/api/trip", tripRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/trip-expenses", tripExpenseRoutes);
app.use("/api/insp-questions", insp_QuestionRoutes);

app.use("/api/inspection-questions", inspectionQuestionRoutes);
app.use("/api/isp-categories", ispCategoryRoutes);

// WORK ORDER ROUTES
app.use("/api/work-orders", workOrderRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/service-type", serviceTypeRoutes);

app.use("/api/fleet-user", fleetUserAuthRoutes);
app.use("/api/fleet-sub-admin", fleetSubAdminRoutes);

//  User Routes
app.use("/api/email-otp", emailOtpRoutes);
app.use("/api/forget-password", forgetpassRoutes);

// Driver Routes
app.use("/api/driver-emails", driverEmailOtpRoutes);
app.use("/api/driver-forgot-password", driverForgetPasswordRoutes);

app.use("/api/driver-status", driverStatusRoutes);

// Routes
app.use("/api/business-user", businessUserRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/driver-licenses", driverLicenseRoutes);
app.use("/api/medical-certificates", medicalCertificateRoutes);
app.use("/api/payroll-records", payrollRoutes);

app.use("/api/equipment", equipmentRoutes);
app.use("/api/maintenance-due", maintenanceRoutes);
app.use("/api/maintenance-history", maintenanceHistoryRoutes);
app.use("/api/workshops", WorkshopRoutes);
app.use("/api/part-replacements", partReplacementRoutes);

app.use("/api/tyre-replacements", tyreReplacementRoutes);
app.use("/api/expenses", expenseRoutes);

app.use("/api/addresses", addressRoutes);

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // during development set frontend URL,  "http://localhost:3000"
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(" Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log(" Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
