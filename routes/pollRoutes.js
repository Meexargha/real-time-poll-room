const express = require("express");
const mongoose = require("mongoose");
const Poll = require("../models/poll");

const router = express.Router();

/*
---------------------------------------------------
CREATE POLL
POST /api/polls
---------------------------------------------------
*/
router.post("/", async (req, res) => {
  try {
    const { question, options } = req.body;

    // Basic validation
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Question and at least 2 options are required",
      });
    }

    // Remove empty options
    const cleanedOptions = options
      .map((opt) => opt.trim())
      .filter((opt) => opt !== "");

    if (cleanedOptions.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 valid options required",
      });
    }

    const poll = await Poll.create({
      question: question.trim(),
      options: cleanedOptions.map((text) => ({ text })),
    });

    res.status(201).json({
      success: true,
      data: poll,
    });
  } catch (error) {
  console.error("CREATE POLL ERROR:", error);
  res.status(500).json({
    success: false,
    message: error.message,
  });
}

  });

/*
---------------------------------------------------
GET POLL BY ID
GET /api/polls/:id
---------------------------------------------------
*/
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check valid Mongo ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid poll ID format",
      });
    }

    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found",
      });
    }

    res.status(200).json({
      success: true,
      data: poll,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching poll",
    });
  }
});

/*
---------------------------------------------------
VOTE
POST /api/polls/:id/vote
---------------------------------------------------
*/
router.post("/:id/vote", async (req, res) => {
  try {
    const { id } = req.params;
    const { optionIndex, voterId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid poll ID",
      });
    }

    if (typeof optionIndex !== "number") {
      return res.status(400).json({
        success: false,
        message: "Invalid option index",
      });
    }

    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found",
      });
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({
        success: false,
        message: "Option does not exist",
      });
    }

    const userIP = req.ip;

    // Anti-abuse checks
    if (poll.votedIPs.includes(userIP)) {
      return res.status(403).json({
        success: false,
        message: "You have already voted (IP restriction)",
      });
    }

    if (!voterId || poll.votedVoterIds.includes(voterId)) {
      return res.status(403).json({
        success: false,
        message: "You have already voted (Browser restriction)",
      });
    }

    // Apply vote
    poll.options[optionIndex].votes += 1;
    poll.votedIPs.push(userIP);
    poll.votedVoterIds.push(voterId);

    await poll.save();

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      io.to(id).emit("pollUpdated", poll);
    }

    res.status(200).json({
      success: true,
      data: poll,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while voting",
    });
  }
});

module.exports = router;
