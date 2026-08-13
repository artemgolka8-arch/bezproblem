import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/permissions.js";
import { logAction } from "../utils/audit.js";

const router = Router();
router.use(requireAuth);

function publicClient(c) {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    city: c.city,
    drivingCity: c.drivingCity,
    pesel: c.pesel,
    documentNumber: c.documentNumber,
    department: c.department,
    bankAccount: c.bankAccount,
    status: c.status,
    notes: c.notes,
    isArchived: c.isArchived,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    vehicleCount: c._count ? c._count.vehicles : undefined,
    debtCount: c._count ? c._count.debts : undefined,
  };
}

// List + search
router.get("/", requirePermission(PERMISSIONS.CLIENTS_VIEW), async (req, res) => {
  const { q, archived } = req.query;
  const where = {
    isArchived: archived === "true",
    ...(q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
            { pesel: { contains: q } },
            { documentNumber: { contains: q } },
          ],
        }
      : {}),
  };

  const clients = await prisma.client.findMany({
    where,
    include: { _count: { select: { vehicles: true, debts: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  res.json({ clients: clients.map(publicClient) });
});

// Detail (with related vehicles + debts)
router.get("/:id", requirePermission(PERMISSIONS.CLIENTS_VIEW), async (req, res) => {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id },
    include: {
      vehicles: { include: { vehicle: true }, orderBy: { issuedAt: "desc" } },
      debts: { include: { payments: true }, orderBy: { incurredAt: "desc" } },
    },
  });
  if (!client) return res.status(404).json({ error: "Клиент не найден" });
  res.json({
    client: publicClient(client),
    vehicleAssignments: client.vehicles.map((a) => ({
      id: a.id,
      vehicle: { id: a.vehicle.id, regNumber: a.vehicle.regNumber, make: a.vehicle.make, model: a.vehicle.model },
      issuedAt: a.issuedAt,
      returnedAt: a.returnedAt,
      notes: a.notes,
    })),
    debts: client.debts.map((d) => ({
      id: d.id,
      amount: d.amount,
      reason: d.reason,
      status: d.status,
      dueDate: d.dueDate,
      incurredAt: d.incurredAt,
      paid: d.payments.reduce((s, p) => s + p.amount, 0),
    })),
  });
});

router.post("/", requirePermission(PERMISSIONS.CLIENTS_MANAGE), async (req, res) => {
  const {
    firstName, lastName, email, phone, city, drivingCity,
    pesel, documentNumber, department, bankAccount, notes,
  } = req.body ?? {};
  if (!firstName || !lastName) {
    return res.status(400).json({ error: "Укажите имя и фамилию клиента" });
  }
  const client = await prisma.client.create({
    data: {
      firstName, lastName, email, phone, city, drivingCity,
      pesel, documentNumber, department, bankAccount, notes,
      createdById: req.employee.id,
      updatedById: req.employee.id,
    },
  });

  await logAction({
    employeeId: req.employee.id,
    action: "CREATE_CLIENT",
    entityType: "Client",
    entityId: client.id,
    newValue: { firstName, lastName },
  });

  res.status(201).json({ client: publicClient(client) });
});

router.patch("/:id", requirePermission(PERMISSIONS.CLIENTS_MANAGE), async (req, res) => {
  const before = await prisma.client.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: "Клиент не найден" });

  const {
    firstName, lastName, email, phone, city, drivingCity,
    pesel, documentNumber, department, bankAccount, notes, status, isArchived,
  } = req.body ?? {};

  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(city !== undefined && { city }),
      ...(drivingCity !== undefined && { drivingCity }),
      ...(pesel !== undefined && { pesel }),
      ...(documentNumber !== undefined && { documentNumber }),
      ...(department !== undefined && { department }),
      ...(bankAccount !== undefined && { bankAccount }),
      ...(notes !== undefined && { notes }),
      ...(status !== undefined && { status }),
      ...(typeof isArchived === "boolean" && { isArchived }),
      updatedById: req.employee.id,
    },
  });

  await logAction({
    employeeId: req.employee.id,
    action: "UPDATE_CLIENT",
    entityType: "Client",
    entityId: client.id,
    oldValue: before,
    newValue: req.body,
  });

  res.json({ client: publicClient(client) });
});

export default router;
