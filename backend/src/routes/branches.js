import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../utils/permissions.js";

const router = Router();
router.use(requireAuth);

router.get("/", requirePermission(PERMISSIONS.BRANCHES_VIEW), async (req, res) => {
  const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });
  res.json({ branches });
});

router.post("/", requirePermission(PERMISSIONS.BRANCHES_MANAGE), async (req, res) => {
  const { name, address } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "Укажите название филиала" });
  const branch = await prisma.branch.create({ data: { name, address } });
  res.status(201).json({ branch });
});

router.patch("/:id", requirePermission(PERMISSIONS.BRANCHES_MANAGE), async (req, res) => {
  const { name, address, isArchived } = req.body ?? {};
  const branch = await prisma.branch.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(address !== undefined && { address }),
      ...(typeof isArchived === "boolean" && { isArchived }),
    },
  });
  res.json({ branch });
});

export default router;
