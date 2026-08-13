import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function signToken(employee) {
  return jwt.sign({ sub: employee.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
}

function publicEmployee(employee) {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    role: { id: employee.role.id, name: employee.role.name, label: employee.role.label },
    permissions: JSON.parse(employee.role.permissions),
    branch: employee.branch ? { id: employee.branch.id, name: employee.branch.name } : null,
    isActive: employee.isActive,
  };
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Укажите email и пароль" });
  }

  const employee = await prisma.employee.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { role: true, branch: true },
  });

  // Same generic error whether the email doesn't exist or the password is
  // wrong, so we don't leak which emails are registered.
  if (!employee) return res.status(401).json({ error: "Неверный email или пароль" });

  if (!employee.isActive) {
    return res.status(403).json({ error: "Учетная запись заблокирована. Обратитесь к администратору." });
  }

  const ok = await bcrypt.compare(password, employee.passwordHash);
  if (!ok) return res.status(401).json({ error: "Неверный email или пароль" });

  await prisma.employee.update({
    where: { id: employee.id },
    data: { lastLoginAt: new Date() },
  });

  const token = signToken(employee);
  res.json({ token, employee: publicEmployee(employee) });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ employee: publicEmployee(req.employee) });
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Укажите текущий и новый пароль" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Новый пароль должен быть не короче 8 символов" });
  }

  const ok = await bcrypt.compare(currentPassword, req.employee.passwordHash);
  if (!ok) return res.status(401).json({ error: "Текущий пароль указан неверно" });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.employee.update({ where: { id: req.employee.id }, data: { passwordHash } });
  res.json({ ok: true });
});

export default router;
