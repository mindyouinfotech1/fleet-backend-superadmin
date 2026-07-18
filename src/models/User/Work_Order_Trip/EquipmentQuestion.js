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
          ref: "Category",
          required: true,
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
