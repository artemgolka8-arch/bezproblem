import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/permissions.js";
import { logAction } from "../utils/audit.js";

const router = Router();
router.use(requireAuth);

export const DEBT_STATUSES = ["NEW", "PARTIALLY_PAID", "PAID", "OVERDUE", "IN_COLLECTION"];

function publicDebt(d) {
  const paid = (d.payments || []).reduce((s, p) => s + p.amount, 0);
  return {
    id: d.id,
    client: d.client ? { id: d.client.id, firstName: d.client.firstName, lastName: d.client.lastName } : undefined,
    clientId: d.clientId,
    amount: d.amount,
    reason: d.reason,
    incurredAt: d.incurredAt,
    dueDate: d.dueDate,
    status: d.status,
    comment: d.comment,
    paid,
    remaining: Math.max(0, d.amount - paid),
    createdAt: d.createdAt,
  };
}

router.get("/statuses", requirePermission(PERMISSIONS.DEBTS_VIEW), (req, res) => {
  res.json({ statuses: DEBT_STATUSES });
});

router.get("/", requirePermission(PERMISSIONS.DEBTS_VIEW), async (req, res) => {
  const { status, clientId, q } = req.query;
  const debts = await prisma.debt.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(clientId ? { clientId } : {}),
      ...(q
        ? {
            client: {
              OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }],
            },
          }
        : {}),
    },
    include: { client: true, payments: true },
    orderBy: { incurredAt: "desc" },
  });
  res.json({ debts: debts.map(publicDebt) });
});

router.post("/", requirePermission(PERMISSIONS.DEBTS_MANAGE), async (req, res) => {
  const { clientId, amount, reason, dueDate, comment } = req.body ?? {};
  if (!clientId || !amount) {
    return res.status(400).json({ error: "Укажите клиента и сумму задолженности" });
  }
  const debt = await prisma.debt.create({
    data: {
      clientId,
      amount: Number(amount),
      reason,
      dueDate: dueDate ? new Date(dueDate) : null,
      comment,
    },
    include: { client: true, payments: true },
  });

  await logAction({
    employeeId: req.employee.id,
    action: "CREATE_DEBT",
    entityType: "Debt",
    entityId: debt.id,
    newValue: { clientId, amount },
  });

  res.status(201).json({ debt: publicDebt(debt) });
});

router.patch("/:id", requirePermission(PERMISSIONS.DEBTS_MANAGE), async (req, res) => {
  const before = await prisma.debt.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: "Задолженность не найдена" });

  const { amount, reason, dueDate, status, comment } = req.body ?? {};
  if (status && !DEBT_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Недопустимый статус" });
  }

  const debt = await prisma.debt.update({
    where: { id: req.params.id },
    data: {
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(reason !== undefined && { reason }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(status !== undefined && { status }),
      ...(comment !== undefined && { comment }),
    },
    include: { client: true, payments: true },
  });

  await logAction({
    employeeId: req.employee.id,
    action: "UPDATE_DEBT",
    entityType: "Debt",
    entityId: debt.id,
    oldValue: { status: before.status, amount: before.amount },
    newValue: { status: debt.status, amount: debt.amount },
  });

  res.json({ debt: publicDebt(debt) });
});

// Register a payment against a debt — auto-updates debt status
router.post("/:id/payments", requirePermission(PERMISSIONS.DEBTS_MANAGE), async (req, res) => {
  const { amount, note, paidAt } = req.body ?? {};
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: "Укажите сумму платежа" });
  }

  const debt = await prisma.debt.findUnique({ where: { id: req.params.id }, include: { payments: true } });
  if (!debt) return res.status(404).json({ error: "Задолженность не найдена" });

  const payment = await prisma.payment.create({
    data: {
      debtId: debt.id,
      clientId: debt.clientId,
      amount: Number(amount),
      note,
      ...(paidAt ? { paidAt: new Date(paidAt) } : {}),
    },
  });

  const totalPaid = debt.payments.reduce((s, p) => s + p.amount, 0) + Number(amount);
  const newStatus = totalPaid >= debt.amount ? "PAID" : "PARTIALLY_PAID";

  const updatedDebt = await prisma.debt.update({
    where: { id: debt.id },
    data: { status: newStatus },
    include: { client: true, payments: true },
  });

  await logAction({
    employeeId: req.employee.id,
    action: "ADD_PAYMENT",
    entityType: "Debt",
    entityId: debt.id,
    newValue: { amount, newStatus },
  });

  res.status(201).json({ payment, debt: publicDebt(updatedDebt) });
});

export default router;
