import mongoose from "mongoose";

const countrySchema = new mongoose.Schema(
  {
    _id: { type: Number },
    name: String,
    iso3: String,
    iso2: String,
    numeric_code: String,
    phonecode: String,

    capital: String,
    currency: String,
    currency_name: String,
    currency_symbol: String,

    tld: String,
    native: String,

    region_id: Number,
    subregion_id: Number,

    nationality: String,

    timezones: Array,
    translations: Object,

    latitude: String,
    longitude: String,

    emoji: String,
    emojiU: String,
  },
  { timestamps: true },
);

export default mongoose.model("Country", countrySchema);
