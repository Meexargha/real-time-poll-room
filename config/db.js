const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Connect to MongoDB using environment variable
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(" MongoDB Connected Successfully");
  } catch (error) {
    console.error(" MongoDB Connection Failed:");
    console.error(error.message);

    // Stop the server if DB fails
    process.exit(1);
  }
};

module.exports = connectDB;
