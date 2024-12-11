const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI =
  'mongodb+srv://cs348:abcde@cluster0.gr6w9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Define the connectDB function
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
//    await mongoose.connect(MONGODB_URI, {
//      useNewUrlParser: true,
//      useUnifiedTopology: true,
//    });
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit the process with a failure code
  }
};

module.exports = connectDB;

