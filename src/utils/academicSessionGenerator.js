import AcademicSession from "../models/AcademicSession.js";

export const ensureAcademicSessions = async () => {
  const startYear = 2024;
  const endYear = 2035;

  // Generate sessions if not exist
  for (let year = startYear; year <= endYear; year++) {
    const name = `${year}-${year + 1}`;

    const exists = await AcademicSession.findOne({ name });

    if (!exists) {
      await AcademicSession.create({
        name,

        startDate: new Date(`${year}-04-01`),
        endDate: new Date(`${year + 1}-03-31`),
        isActive: false,
      });
    }
  }

  // Ensure one active session
  let activeSession = await AcademicSession.findOne({
    isActive: true,
  });

  if (!activeSession) {
    activeSession = await AcademicSession.findOne({
      name: "2024-2025",
    });

    if (activeSession) {
      activeSession.isActive = true;
      await activeSession.save();
    }
  }

  return activeSession;
};
