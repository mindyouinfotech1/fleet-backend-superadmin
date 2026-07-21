import mongoose from "mongoose";

const tripStopSchema = new mongoose.Schema(
  {
    sequence: {
      type: Number,
      required: true,
    },
    stopName: {
      type: String,
      // required: true,
      trim: true,
    },
    stopType: {
      type: String,
      enum: [
        "Start",
        "Pickup",
        "Delivery",
        "Loading",
        "Unloading",
        "Fuel",
        "Break",
        "Rest",
        "Waypoint",
        "End",
      ],
      default: "Waypoint",
    },
    location: {
      address: String,
      latitude: Number,
      longitude: Number,
    },
    plannedArrival: Date,
    plannedDeparture: Date,
    actualArrival: Date,
    actualDeparture: Date,
    status: {
      type: String,
      enum: [
        "Pending",
        "Upcoming",
        "Reached",
        "Completed",
        "Skipped",
        "Cancelled",
      ],
      default: "Pending",
    },
    notes: String,
  },
  { _id: true },
);

const tripRouteSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
    tripcode: {
      type: String,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      // unique: true,
    },
    routeName: {
      type: String,
      default: "",
    },
    totalStops: {
      type: Number,
      default: 0,
    },
    completedStops: {
      type: Number,
      default: 0,
    },
    pendingStops: {
      type: Number,
      default: 0,
    },
    skippedStops: {
      type: Number,
      default: 0,
    },
    currentStopIndex: {
      type: Number,
      default: 0,
    },
    totalDistance: {
      type: Number,
      default: 0,
    },
    estimatedDuration: {
      type: Number, // Minutes
      default: 0,
    },
    actualDuration: {
      type: Number,
      default: 0,
    },
    routeStatus: {
      type: String,
      enum: ["Planned", "Started", "In Progress", "Completed", "Cancelled"],
      default: "Planned",
    },
    stops: [tripStopSchema],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const TripRoute = mongoose.model("TripRoute", tripRouteSchema);
