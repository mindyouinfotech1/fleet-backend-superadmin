import { Counter } from "../models/Address/Counter.js";
/**
 * Organization-wise sequential code generate karta hai.
 * Example: generateCode(organizationId, "branch", "BRCH") => "BRCH-000001"
 */
export const generateCode = async (organizationId, entityType, prefix) => {
  const counter = await Counter.findOneAndUpdate(
    { organizationId, entityType },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }, // pehli baar na ho to bana do, seq 1 se start
  );

  const paddedSeq = String(counter.seq).padStart(6, "0"); // 000001

  return `${prefix}-${paddedSeq}`;
};
