const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const reservationRoutes = require('./routes/reservations');
const restaurantRoutes = require('./routes/restaurants');
const userRoutes = require('./routes/users');

dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'https://reservation-tracker-443907.appspot.com'], // Allowed origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Allowed HTTP methods
  credentials: true, // Allow cookies or other credentials
}));

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/reservation', reservationRoutes);
app.use('/restaurant', restaurantRoutes);
app.use('/user', userRoutes);

// Serve static files from the `build` directory
//app.use(express.static(path.join(__dirname, '../reservations_client/build')));

// Serve `index.html` for the root path
//app.get('/', (req, res) => {
//  res.sendFile(path.join(__dirname, '../reservations_client/build/index.html'));
//});

// Catch-all route for SPAs to serve `index.html` for other routes
//app.get('*', (req, res) => {
//  res.sendFile(path.join(__dirname, '../reservations_client/build/index.html'));
//});

app.use(express.static(path.join(__dirname, 'build')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});



// Set port 8080 for the server
const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
