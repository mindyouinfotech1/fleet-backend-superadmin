import Counter from "../models/Student/Counter.js";

export const generateAdmissionNo = async (schoolId) => {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { schoolId, key: "admissionNo" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  return `ADM-${year}-${String(counter.seq).padStart(4, "0")}`;
};

export const generateStudentCode = async (schoolId) => {
  const counter = await Counter.findOneAndUpdate(
    { schoolId, key: "studentCode" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  return `STU-${String(counter.seq).padStart(5, "0")}`;
};

// import Counter from "../models/Student/Counter.js";

// /* ======================================================
//    ADMISSION NUMBER
//    (Unique per School + Branch + Session)
// ====================================================== */
// export const generateAdmissionNo = async (
//   schoolId,
//   branchId,
//   academicSessionId,
// ) => {
//   const year = new Date().getFullYear();

//   const counter = await Counter.findOneAndUpdate(
//     {
//       schoolId,
//       branchId,
//       academicSessionId,
//       key: "admissionNo",
//     },
//     {
//       $inc: { seq: 1 },
//     },
//     {
//       new: true,
//       upsert: true,
//       setDefaultsOnInsert: true,
//     },
//   );

//   return `ADM-${year}-${String(counter.seq).padStart(4, "0")}`;
// };

// /* ======================================================
//    STUDENT CODE
//    (Unique per School only)
// ====================================================== */
// export const generateStudentCode = async (schoolId) => {
//   const counter = await Counter.findOneAndUpdate(
//     {
//       schoolId,
//       key: "studentCode",
//     },
//     {
//       $inc: { seq: 1 },
//     },
//     {
//       new: true,
//       upsert: true,
//       setDefaultsOnInsert: true,
//     },
//   );

//   return `STU-${String(counter.seq).padStart(5, "0")}`;
// };
