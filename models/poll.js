const mongoose = require("mongoose");

// Option schema (each option inside poll)
const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  votes: {
    type: Number,
    default: 0,
  },
});

// Main Poll schema
const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [optionSchema],
      validate: {
        validator: function (value) {
          return value.length >= 2;
        },
        message: "At least 2 options are required",
      },
    },

    // Anti-abuse tracking
    votedIPs: {
      type: [String],
      default: [],
    },

    votedVoterIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Poll", pollSchema);
