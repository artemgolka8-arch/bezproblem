import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS, ALL_PERMISSION_KEYS } from "../utils/permissions.js";
import { logAction } from "../utils/audit.js";

const router = Router();
router.use(requireAuth);

function publicEmployee(e) {
  return {
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    isActive: e.isActive,
    lastLoginAt: e.lastLoginAt,
    role: e.role ? { id: e.role.id, name: e.role.name, label: e.role.label } : null,
    branch: e.branch ? { id: e.branch.id, name: e.branch.name } : null,
    createdAt: e.createdAt,
  };
}

// List all employees — visible to anyone who can view the section
router.get("/", requirePermission(PERMISSIONS.EMPLOYEES_VIEW), async (req, res) => {
  const employees = await prisma.employee.findMany({
    include: { role: true, branch: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  res.json({ employees: employees.map(publicEmployee) });
});

// Create employee
router.post("/", requirePermission(PERMISSIONS.EMPLOYEES_MANAGE), async (req, res) => {
  const { firstName, lastName, email, password, roleId, branchId } = req.body ?? {};
  if (!firstName || !lastName || !email || !password || !roleId) {
    return res.status(400).json({ error: "Заполните имя, фамилию, email, пароль и роль" });
  }
  const existing = await prisma.employee.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) return res.status(409).json({ error: "Сотрудник с таким email уже существует" });

  const passwordHash = await bcrypt.hash(password, 12);
  const employee = await prisma.employee.create({
    data: {
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      passwordHash,
      roleId,
      branchId: branchId || null,
    },
    include: { role: true, branch: true },
  });

  await logAction({
    employeeId: req.employee.id,
    action: "CREATE_EMPLOYEE",
    entityType: "Employee",
    entityId: employee.id,
    newValue: { email: employee.email, roleId },
  });

  res.status(201).json({ employee: publicEmployee(employee) });
});

// Edit employee profile (name, email, role, branch)
router.patch("/:id", requirePermission(PERMISSIONS.EMPLOYEES_MANAGE), async (req, res) => {
  const before = await prisma.employee.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: "Сотрудник не найден" });

  const { firstName, lastName, email, roleId, branchId } = req.body ?? {};
  const employee = await prisma.employee.update({
    where: { id: req.params.id },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email: email.toLowerCase().trim() }),
      ...(roleId && { roleId }),
      ...(branchId !== undefined && { branchId: branchId || null }),
    },
    include: { role: true, branch: true },
  });

  await logAction({
    employeeId: req.employee.id,
    action: "UPDATE_EMPLOYEE",
    entityType: "Employee",
    entityId: employee.id,
    oldValue: before,
    newValue: req.body,
  });

  res.json({ employee: publicEmployee(employee) });
});

// Block / unblock
router.patch("/:id/active", requirePermission(PERMISSIONS.EMPLOYEES_MANAGE), async (req, res) => {
  const { isActive } = req.body ?? {};
  if (typeof isActive !== "boolean") return res.status(400).json({ error: "isActive должен быть true/false" });

  if (req.params.id === req.employee.id && isActive === false) {
    return res.status(400).json({ error: "Нельзя заблокировать собственную учетную запись" });
  }

  const employee = await prisma.employee.update({
    where: { id: req.params.id },
    data: { isActive },
    include: { role: true, branch: true },
  });

  await logAction({
    employeeId: req.employee.id,
    action: isActive ? "UNBLOCK_EMPLOYEE" : "BLOCK_EMPLOYEE",
    entityType: "Employee",
    entityId: employee.id,
  });

  res.json({ employee: publicEmployee(employee) });
});

// Admin resets someone's password
router.post("/:id/reset-password", requirePermission(PERMISSIONS.EMPLOYEES_MANAGE), async (req, res) => {
  const { newPassword } = req.body ?? {};
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Новый пароль должен быть не короче 8 символов" });
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.employee.update({ where: { id: req.params.id }, data: { passwordHash } });

  await logAction({
    employeeId: req.employee.id,
    action: "RESET_PASSWORD",
    entityType: "Employee",
    entityId: req.params.id,
  });

  res.json({ ok: true });
});

// Delete employee
router.delete("/:id", requirePermission(PERMISSIONS.EMPLOYEES_MANAGE), async (req, res) => {
  if (req.params.id === req.employee.id) {
    return res.status(400).json({ error: "Нельзя удалить собственную учетную запись" });
  }
  await prisma.employee.delete({ where: { id: req.params.id } });

  await logAction({
    employeeId: req.employee.id,
    action: "DELETE_EMPLOYEE",
    entityType: "Employee",
    entityId: req.params.id,
  });

  res.json({ ok: true });
});

// ---- Roles ----

router.get("/roles/list", requirePermission(PERMISSIONS.EMPLOYEES_VIEW), async (req, res) => {
  const roles = await prisma.role.findMany({ orderBy: { label: "asc" } });
  res.json({
    roles: roles.map((r) => ({ id: r.id, name: r.name, label: r.label, permissions: JSON.parse(r.permissions) })),
    allPermissions: ALL_PERMISSION_KEYS,
  });
});

router.post("/roles", requirePermission(PERMISSIONS.EMPLOYEES_MANAGE), async (req, res) => {
  const { name, label, permissions } = req.body ?? {};
  if (!name || !label || !Array.isArray(permissions)) {
    return res.status(400).json({ error: "Укажите name, label и массив permissions" });
  }
  const role = await prisma.role.create({
    data: { name, label, permissions: JSON.stringify(permissions) },
  });
  res.status(201).json({ role: { ...role, permissions } });
});

router.patch("/roles/:id", requirePermission(PERMISSIONS.EMPLOYEES_MANAGE), async (req, res) => {
  const { label, permissions } = req.body ?? {};
  const role = await prisma.role.update({
    where: { id: req.params.id },
    data: {
      ...(label && { label }),
      ...(Array.isArray(permissions) && { permissions: JSON.stringify(permissions) }),
    },
  });
  res.json({ role: { ...role, permissions: JSON.parse(role.permissions) } });
});

export default router;
