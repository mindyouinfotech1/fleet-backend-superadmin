import mongoose from "mongoose";

const InspectionQuestion_Schema = new mongoose.Schema(
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

    categories: [
      {
        categoryName: {
          type: String,
          // required: true,
          // trim: true,
        },
        questions: [
          {
            question: {
              type: String,
              required: true,
              trim: true,
            },

            answer: {
              type: String,
              required: true,
              trim: true,
            },

            isMandatory: {
              type: Boolean,
              default: true,
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

export const InspectionQuestion = mongoose.model(
  "Inspection_Question",
  InspectionQuestion_Schema,
);
