import { Counter } from "../models/Address/Counter.js";

export const generateCode = async (organizationId, entityType, prefix) => {
  const counter = await Counter.findOneAndUpdate(
    { organizationId, entityType },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  const paddedSeq = String(counter.seq).padStart(6, "0"); 

  return `${prefix}-${paddedSeq}`;
};
