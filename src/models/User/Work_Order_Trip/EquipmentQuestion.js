import mongoose from "mongoose";

const InspectionQuestionSchema = new mongoose.Schema(
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
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "InspectionCategory",
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

export const InspectionQuestion = mongoose.model(
  "InspectionQuestion",
  InspectionQuestionSchema,
);
