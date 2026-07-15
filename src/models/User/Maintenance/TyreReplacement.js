import mongoose from "mongoose";

const tyreReplacementSchema = new mongoose.Schema(
  {
   organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessUser",
        required: true,
    },
    tyreReplacementCode: {
      type: String,
      required: true,
      trim: true,
    },
  
      equipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Equipment",
        required: true,
      },
  
      driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
        // required: true,
      },
  
      workshopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workshop",
        // required: true,
      },
    tyreName: {
      type: String,
      required: true,
    },
    wheelPosition: {
      type: String,
      //   required: true,
    },
    tyreSerialNumber: {
      type: String,
      //   required: true,
      //   unique: true,
    },
    costOfTyre: {
      type: Number,
      //   required: true,
    },
    dateOfReplacement: {
      type: Date,
      //   required: true,
    },
    tyreSize: {
      type: String,
      default: null,
    },
    odometerReadingAtReplacement: {
      type: Number,
      //   required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("TyreReplacement", tyreReplacementSchema);
