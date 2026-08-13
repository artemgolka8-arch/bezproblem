import { prisma } from "./prisma.js";

/**
 * Record an entry in the audit trail (see ТЗ section 12 "История действий").
 * Call this any time a meaningful field changes, e.g.:
 *   await logAction({
 *     employeeId: req.employee.id,
 *     action: "UPDATE_STATUS",
 *     entityType: "Vehicle",
 *     entityId: vehicle.id,
 *     oldValue: { status: "AT_BRANCH" },
 *     newValue: { status: "ISSUED_TO_CLIENT" },
 *   });
 */
export async function logAction({ employeeId, action, entityType, entityId, oldValue, newValue }) {
  await prisma.actionLog.create({
    data: {
      employeeId: employeeId ?? null,
      action,
      entityType,
      entityId,
      oldValue: oldValue !== undefined ? JSON.stringify(oldValue) : null,
      newValue: newValue !== undefined ? JSON.stringify(newValue) : null,
    },
  });
}
