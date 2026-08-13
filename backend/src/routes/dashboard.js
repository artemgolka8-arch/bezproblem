import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/permissions.js";

const router = Router();
router.use(requireAuth, requirePermission(PERMISSIONS.DASHBOARD_VIEW));

router.get("/", async (req, res) => {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    clientsCount,
    vehiclesCount,
    vehiclesAtBranch,
    debtsOpen,
    debtSumAgg,
    upcomingMaintenance,
    overdueMaintenance,
    recentLogs,
  ] = await Promise.all([
    prisma.client.count({ where: { isArchived: false } }),
    prisma.vehicle.count({ where: { isArchived: false } }),
    prisma.vehicle.count({ where: { status: "AT_BRANCH", isArchived: false } }),
    prisma.debt.count({ where: { status: { in: ["NEW", "PARTIALLY_PAID", "OVERDUE", "IN_COLLECTION"] } } }),
    prisma.debt.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["NEW", "PARTIALLY_PAID", "OVERDUE", "IN_COLLECTION"] } },
    }),
    prisma.maintenanceRecord.findMany({
      where: { nextServiceDue: { gte: now, lte: in7Days } },
      include: { vehicle: true },
      orderBy: { nextServiceDue: "asc" },
      take: 10,
    }),
    prisma.maintenanceRecord.findMany({
      where: { nextServiceDue: { lt: now } },
      include: { vehicle: true },
      orderBy: { nextServiceDue: "asc" },
      take: 10,
    }),
    prisma.actionLog.findMany({
      include: { employee: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  res.json({
    clientsCount,
    vehiclesCount,
    vehiclesAtBranch,
    debtsOpen,
    debtSumTotal: debtSumAgg._sum.amount || 0,
    upcomingMaintenance: upcomingMaintenance.map((m) => ({
      id: m.id,
      vehicle: m.vehicle.regNumber,
      workType: m.workType,
      nextServiceDue: m.nextServiceDue,
    })),
    overdueMaintenance: overdueMaintenance.map((m) => ({
      id: m.id,
      vehicle: m.vehicle.regNumber,
      workType: m.workType,
      nextServiceDue: m.nextServiceDue,
    })),
    recentActivity: recentLogs.map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      by: l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : "Система",
      at: l.createdAt,
    })),
  });
});

export default router;
