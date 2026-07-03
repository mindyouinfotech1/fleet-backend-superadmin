import mongoose from "mongoose";

const stateSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    name: String,
    state_code: String,
    type: String,

    country_id: Number,
    country_code: String,
    country_name: String,

    latitude: String,
    longitude: String,

    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
    },
  },
  { timestamps: true },
);

export default mongoose.model("State", stateSchema);
