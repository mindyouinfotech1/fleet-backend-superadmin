import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    _id: { type: Number },
    name: String,
    state_id: Number,
    state_code: String,
    state_name: String,

    country_id: Number,
    country_code: String,
    country_name: String,

    latitude: String,
    longitude: String,

    wikiDataId: String,

    location: Object,

    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
    },

    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
    },
  },
  { timestamps: true },
);

export default mongoose.model("City", citySchema);
