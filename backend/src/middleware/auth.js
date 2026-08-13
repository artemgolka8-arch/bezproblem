import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.js";

// Verifies the Bearer token, loads the employee (with role+permissions),
// and rejects blocked accounts. Attaches `req.employee`.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Требуется авторизация" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const employee = await prisma.employee.findUnique({
      where: { id: payload.sub },
      include: { role: true, branch: true },
    });

    if (!employee) return res.status(401).json({ error: "Пользователь не найден" });
    if (!employee.isActive) return res.status(403).json({ error: "Учетная запись заблокирована" });

    req.employee = employee;
    req.permissions = JSON.parse(employee.role.permissions);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Недействительный или истекший токен" });
  }
}

// Usage: router.get("/", requireAuth, requirePermission(PERMISSIONS.CLIENTS_VIEW), handler)
export function requirePermission(...permissionKeys) {
  return (req, res, next) => {
    const has = permissionKeys.every((key) => req.permissions?.includes(key));
    if (!has) return res.status(403).json({ error: "Недостаточно прав доступа" });
    next();
  };
}
