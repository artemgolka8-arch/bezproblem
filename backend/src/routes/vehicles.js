import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/permissions.js";
import { logAction } from "../utils/audit.js";

const router = Router();
router.use(requireAuth);

export const VEHICLE_STATUSES = [
  "AT_BRANCH",
  "ISSUED_TO_CLIENT",
  "IN_REPAIR",
  "IN_SERVICE",
  "RESERVED",
  "UNAVAILABLE",
  "SOLD_OFF",
];

function publicVehicle(v) {
  return {
    id: v.id,
    regNumber: v.regNumber,
    make: v.make,
    model: v.model,
    year: v.year,
    vin: v.vin,
    type: v.type,
    status: v.status,
    mileage: v.mileage,
    condition: v.condition,
    notes: v.notes,
    isArchived: v.isArchived,
    branch: v.branch ? { id: v.branch.id, name: v.branch.name } : null,
    currentClient:
      v.assignments && v.assignments.length
        ? (() => {
            const active = v.assignments.find((a) => !a.returnedAt);
            return active ? { id: active.client.id, firstName: active.client.firstName, lastName: active.client.lastName, assignmentId: active.id } : null;
          })()
        : undefined,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

router.get("/statuses", requirePermission(PERMISSIONS.VEHICLES_VIEW), (req, res) => {
  res.json({ statuses: VEHICLE_STATUSES });
});

router.get("/", requirePermission(PERMISSIONS.VEHICLES_VIEW), async (req, res) => {
  const { q, status, branchId, archived } = req.query;
  const where = {
    isArchived: archived === "true",
    ...(status ? { status } : {}),
    ...(branchId ? { branchId } : {}),
    ...(q
      ? {
          OR: [
            { regNumber: { contains: q } },
            { make: { contains: q } },
            { model: { contains: q } },
            { vin: { contains: q } },
          ],
        }
      : {}),
  };

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      branch: true,
      assignments: { where: { returnedAt: null }, include: { client: true } },
    },
    orderBy: { regNumber: "asc" },
  });
  res.json({ vehicles: vehicles.map(publicVehicle) });
});

router.get("/:id", requirePermission(PERMISSIONS.VEHICLES_VIEW), async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: {
      branch: true,
      assignments: { include: { client: true }, orderBy: { issuedAt: "desc" } },
      maintenance: { orderBy: { performedAt: "desc" } },
    },
  });
  if (!vehicle) return res.status(404).json({ error: "ТС не найдено" });
  res.json({
    vehicle: publicVehicle({ ...vehicle, assignments: vehicle.assignments.filter((a) => !a.returnedAt) }),
    assignmentHistory: vehicle.assignments.map((a) => ({
      id: a.id,
      client: { id: a.client.id, firstName: a.client.firstName, lastName: a.client.lastName },
      issuedAt: a.issuedAt,
      returnedAt: a.returnedAt,
      notes: a.notes,
    })),
    maintenanceHistory: vehicle.maintenance,
  });
});

router.post("/", requirePermission(PERMISSIONS.VEHICLES_MANAGE), async (req, res) => {
  const { regNumber, make, model, year, vin, type, branchId, mileage, condition, notes } = req.body ?? {};
  if (!regNumber || !make || !model) {
    return res.status(400).json({ error: "Укажите номер, марку и модель" });
  }
  const vehicle = await prisma.vehicle.create({
    data: {
      regNumber, make, model,
      year: year ? Number(year) : null,
      vin: vin || null,
      type, branchId: branchId || null,
      mileage: mileage ? Number(mileage) : null,
      condition, notes,
    },
  });

  await logAction({
    employeeId: req.employee.id,
    action: "CREATE_VEHICLE",
    entityType: "Vehicle",
    entityId: vehicle.id,
    newValue: { regNumber, make, model },
  });

  res.status(201).json({ vehicle: publicVehicle(vehicle) });
});

router.patch("/:id", requirePermission(PERMISSIONS.VEHICLES_MANAGE), async (req, res) => {
  const before = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: "ТС не найдено" });

  const { regNumber, make, model, year, vin, type, branchId, status, mileage, condition, notes, isArchived } = req.body ?? {};

  if (status && !VEHICLE_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Недопустимый статус" });
  }

  const vehicle = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: {
      ...(regNumber !== undefined && { regNumber }),
      ...(make !== undefined && { make }),
      ...(model !== undefined && { model }),
      ...(year !== undefined && { year: year ? Number(year) : null }),
      ...(vin !== undefined && { vin: vin || null }),
      ...(type !== undefined && { type }),
      ...(branchId !== undefined && { branchId: branchId || null }),
      ...(status !== undefined && { status }),
      ...(mileage !== undefined && { mileage: mileage ? Number(mileage) : null }),
      ...(condition !== undefined && { condition }),
      ...(notes !== undefined && { notes }),
      ...(typeof isArchived === "boolean" && { isArchived }),
    },
  });

  await logAction({
    employeeId: req.employee.id,
    action: "UPDATE_VEHICLE",
    entityType: "Vehicle",
    entityId: vehicle.id,
    oldValue: { status: before.status },
    newValue: { status: vehicle.status },
  });

  res.json({ vehicle: publicVehicle(vehicle) });
});

// Assign vehicle to a client (issue it out)
router.post("/:id/assign", requirePermission(PERMISSIONS.VEHICLES_MANAGE), async (req, res) => {
  const { clientId, notes } = req.body ?? {};
  if (!clientId) return res.status(400).json({ error: "Укажите клиента" });

  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id }, include: { assignments: { where: { returnedAt: null } } } });
  if (!vehicle) return res.status(404).json({ error: "ТС не найдено" });
  if (vehicle.assignments.length) return res.status(409).json({ error: "ТС уже выдано клиенту" });

  const assignment = await prisma.vehicleAssignment.create({
    data: { vehicleId: vehicle.id, clientId, notes },
  });
  await prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: "ISSUED_TO_CLIENT" } });

  await logAction({
    employeeId: req.employee.id,
    action: "ASSIGN_VEHICLE",
    entityType: "Vehicle",
    entityId: vehicle.id,
    newValue: { clientId },
  });

  res.status(201).json({ assignment });
});

// Return vehicle from client
router.post("/:id/return", requirePermission(PERMISSIONS.VEHICLES_MANAGE), async (req, res) => {
  const active = await prisma.vehicleAssignment.findFirst({
    where: { vehicleId: req.params.id, returnedAt: null },
  });
  if (!active) return res.status(409).json({ error: "У ТС нет активной выдачи" });

  const assignment = await prisma.vehicleAssignment.update({
    where: { id: active.id },
    data: { returnedAt: new Date() },
  });
  await prisma.vehicle.update({ where: { id: req.params.id }, data: { status: "AT_BRANCH" } });

  await logAction({
    employeeId: req.employee.id,
    action: "RETURN_VEHICLE",
    entityType: "Vehicle",
    entityId: req.params.id,
  });

  res.json({ assignment });
});

export default router;
