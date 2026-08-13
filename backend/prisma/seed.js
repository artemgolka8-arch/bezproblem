import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_EMPLOYEE_PERMISSIONS,
} from "../src/utils/permissions.js";

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: { permissions: JSON.stringify(DEFAULT_ADMIN_PERMISSIONS) },
    create: {
      name: "ADMIN",
      label: "Администратор",
      permissions: JSON.stringify(DEFAULT_ADMIN_PERMISSIONS),
    },
  });

  await prisma.role.upsert({
    where: { name: "EMPLOYEE" },
    update: { permissions: JSON.stringify(DEFAULT_EMPLOYEE_PERMISSIONS) },
    create: {
      name: "EMPLOYEE",
      label: "Сотрудник",
      permissions: JSON.stringify(DEFAULT_EMPLOYEE_PERMISSIONS),
    },
  });

  const branch = await prisma.branch.upsert({
    where: { name: "Главный офис" },
    update: {},
    create: { name: "Главный офис", address: "" },
  });

  const email = (process.env.SEED_ADMIN_EMAIL || "admin@bezproblem.local").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.employee.upsert({
    where: { email },
    update: {},
    create: {
      firstName: "Админ",
      lastName: "Системы",
      email,
      passwordHash,
      roleId: adminRole.id,
      branchId: branch.id,
    },
  });

  console.log("Готово. Данные для входа:");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log("Смените этот пароль после первого входа.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
