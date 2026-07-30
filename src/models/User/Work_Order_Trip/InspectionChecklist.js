// import mongoose from "mongoose";

// const InspectionChecklistSchema = new mongoose.Schema(
//   {
//     organizationId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "BusinessUser",
//       required: true,
//       index: true,
//     },

//     equipmentId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Equipment",
//       required: true,
//       index: true,
//     },

//     // Kaunsi type ki inspection hai (jaise: Safety Inspection, Maintenance Inspection, etc.)
//     inspectionType: {
//       type: String,
//       // required: true,
//       trim: true,
//     },

//     // Trip ke kis stage par ye checklist applicable hai
//     inspectionTripType: {
//       type: String,
//       enum: ["Pre-trip", "Post-trip", "Intermediate"],
//       // required: true,
//     },

//     categories: [
//       {
//         categoryName: {
//           type: String,
//           // required: true,
//           trim: true,
//         },

//         questions: [
//           {
//             question: {
//               type: String,
//               // required: true,
//               trim: true,
//             },

//             // Fixed 4 options — checklist-style questions ke liye
//             expectedValue: {
//               type: String,
//               enum: ["Yes", "No", "Need Attention in Future", "Not Applicable"],
//               // required: true,
//               trim: true,
//             },

//             isMandatory: {
//               type: Boolean,
//               default: true, // by default sab mandatory maan lo
//             },

//             priority: {
//               type: String,
//               enum: ["high", "medium", "low"],
//               default: "medium",
//             },
//           },
//         ],
//       },
//     ],
//   },
//   {
//     timestamps: true,
//   },
// );

// export const InspectionChecklist = mongoose.model(
//   "InspectionChecklist",
//   InspectionChecklistSchema,
// );

import mongoose from "mongoose";

const InspectionChecklistSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
      index: true,
    },

    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
      index: true,
    },

    // Kaunsi type ki inspection hai (jaise: Safety Inspection, Maintenance Inspection, etc.)
    inspectionType: {
      type: String,
      // required: true,
      trim: true,
    },

    // Trip ke kis stage par ye checklist applicable hai
    inspectionTripType: {
      type: String,
      enum: ["Pre-trip", "Post-trip", "Intermediate"],
      // required: true,
    },

    categories: [
      {
        categoryName: {
          type: String,
          // required: true,
          trim: true,
        },

        questions: [
          {
            question: {
              type: String,
              // required: true,
              trim: true,
            },

            // Optional guidance/criteria text — batata hai ki
            // "sahi" condition kaisi dikhni chahiye (driver ke liye help text)
            description: {
              type: String,
              trim: true,
            },

            // Fixed 4 options — checklist-style questions ke liye
            expectedValue: {
              type: String,
              enum: ["Yes", "No", "Need Attention in Future", "Not Applicable"],
              // required: true,
              trim: true,
            },

            isMandatory: {
              type: Boolean,
              default: true, // by default sab mandatory maan lo
            },

            priority: {
              type: String,
              enum: ["high", "medium", "low"],
              default: "medium",
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const InspectionChecklist = mongoose.model(
  "InspectionChecklist",
  InspectionChecklistSchema,
);
