import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/permissions.js";
import { logAction } from "../utils/audit.js";

const router = Router();
router.use(requireAuth);

function publicRecord(m) {
  return {
    id: m.id,
    vehicle: m.vehicle ? { id: m.vehicle.id, regNumber: m.vehicle.regNumber, make: m.vehicle.make, model: m.vehicle.model } : undefined,
    vehicleId: m.vehicleId,
    workType: m.workType,
    performedAt: m.performedAt,
    mileageAtService: m.mileageAtService,
    nextMileageDue: m.nextMileageDue,
    nextServiceDue: m.nextServiceDue,
    cost: m.cost,
    workshop: m.workshop,
    description: m.description,
    loggedBy: m.loggedBy ? `${m.loggedBy.firstName} ${m.loggedBy.lastName}` : null,
    createdAt: m.createdAt,
  };
}

// List all records, with filters: vehicleId, due=upcoming|overdue
router.get("/", requirePermission(PERMISSIONS.MAINTENANCE_VIEW), async (req, res) => {
  const { vehicleId, due } = req.query;
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const where = {
    ...(vehicleId ? { vehicleId } : {}),
    ...(due === "upcoming" ? { nextServiceDue: { gte: now, lte: in7Days } } : {}),
    ...(due === "overdue" ? { nextServiceDue: { lt: now } } : {}),
  };

  const records = await prisma.maintenanceRecord.findMany({
    where,
    include: { vehicle: true, loggedBy: true },
    orderBy: { performedAt: "desc" },
  });
  res.json({ records: records.map(publicRecord) });
});

router.post("/", requirePermission(PERMISSIONS.MAINTENANCE_MANAGE), async (req, res) => {
  const { vehicleId, workType, performedAt, mileageAtService, nextMileageDue, nextServiceDue, cost, workshop, description } = req.body ?? {};
  if (!vehicleId || !workType || !performedAt) {
    return res.status(400).json({ error: "Укажите ТС, вид работ и дату выполнения" });
  }

  const record = await prisma.maintenanceRecord.create({
    data: {
      vehicleId,
      workType,
      performedAt: new Date(performedAt),
      mileageAtService: mileageAtService ? Number(mileageAtService) : null,
      nextMileageDue: nextMileageDue ? Number(nextMileageDue) : null,
      nextServiceDue: nextServiceDue ? new Date(nextServiceDue) : null,
      cost: cost ? Number(cost) : null,
      workshop,
      description,
      loggedById: req.employee.id,
    },
    include: { vehicle: true, loggedBy: true },
  });

  // Keep the vehicle's mileage in sync if this service reported a newer value
  if (mileageAtService) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (vehicle && (!vehicle.mileage || Number(mileageAtService) > vehicle.mileage)) {
      await prisma.vehicle.update({ where: { id: vehicleId }, data: { mileage: Number(mileageAtService) } });
    }
  }

  await logAction({
    employeeId: req.employee.id,
    action: "CREATE_MAINTENANCE",
    entityType: "MaintenanceRecord",
    entityId: record.id,
    newValue: { vehicleId, workType },
  });

  res.status(201).json({ record: publicRecord(record) });
});

router.patch("/:id", requirePermission(PERMISSIONS.MAINTENANCE_MANAGE), async (req, res) => {
  const before = await prisma.maintenanceRecord.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: "Запись не найдена" });

  const { workType, performedAt, mileageAtService, nextMileageDue, nextServiceDue, cost, workshop, description } = req.body ?? {};

  const record = await prisma.maintenanceRecord.update({
    where: { id: req.params.id },
    data: {
      ...(workType !== undefined && { workType }),
      ...(performedAt !== undefined && { performedAt: new Date(performedAt) }),
      ...(mileageAtService !== undefined && { mileageAtService: mileageAtService ? Number(mileageAtService) : null }),
      ...(nextMileageDue !== undefined && { nextMileageDue: nextMileageDue ? Number(nextMileageDue) : null }),
      ...(nextServiceDue !== undefined && { nextServiceDue: nextServiceDue ? new Date(nextServiceDue) : null }),
      ...(cost !== undefined && { cost: cost ? Number(cost) : null }),
      ...(workshop !== undefined && { workshop }),
      ...(description !== undefined && { description }),
    },
    include: { vehicle: true, loggedBy: true },
  });

  await logAction({
    employeeId: req.employee.id,
    action: "UPDATE_MAINTENANCE",
    entityType: "MaintenanceRecord",
    entityId: record.id,
    oldValue: before,
    newValue: req.body,
  });

  res.json({ record: publicRecord(record) });
});

router.delete("/:id", requirePermission(PERMISSIONS.MAINTENANCE_MANAGE), async (req, res) => {
  await prisma.maintenanceRecord.delete({ where: { id: req.params.id } });
  await logAction({
    employeeId: req.employee.id,
    action: "DELETE_MAINTENANCE",
    entityType: "MaintenanceRecord",
    entityId: req.params.id,
  });
  res.json({ ok: true });
});

export default router;
