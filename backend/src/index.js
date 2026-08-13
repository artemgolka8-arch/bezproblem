import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employees.js";
import branchRoutes from "./routes/branches.js";
import dashboardRoutes from "./routes/dashboard.js";
import clientRoutes from "./routes/clients.js";
import vehicleRoutes from "./routes/vehicles.js";
import maintenanceRoutes from "./routes/maintenance.js";
import debtRoutes from "./routes/debts.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/debts", debtRoutes);

// Отдаём собранный фронтенд (frontend/dist -> backend/public при сборке)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// Все остальные адреса (не /api) отдаём index.html — React сам разберёт маршрут
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`BezProblem API запущен: http://localhost:${port}`);
});
