const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const mongoose = require('mongoose');

// route to get all restaurants from the database
router.get('/', async (req, res) => {
    try {
        const getRestaurants = await Restaurant.find();
        res.json(getRestaurants);
    } catch (err) {
        res.status(500).json({message: 'Error fetching restaurants', error: err});
    }
});

// route to get specific restaurant
router.get('/:id', async (req, res) => {
    const restaurantId = req.params.id;
    try {
        const getRestaurant = await Restaurant.findById(restaurantId);
        if (!getRestaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.json(getRestaurant);
    } catch (err) {
        res.status(500).json({message: 'Error fetching restaurant', error: err});
    }
});

// Route to update restaurant rating and diners
// For rating update, Repeatable Read or MongoDB's atomic update operations would be the appropriate isolation level
// there is  no limit of how many users can update
// Only lock when mutplie users are updating the same row or restaurant
// Allows concurrent transactions to proceed on different rows (restaurants) without locking the entire table.
router.patch('/updateRating/:id', async (req, res) => {
    const { id } = req.params; // Restaurant ID from URL
    const { myRating } = req.body; // New rating provided by the user
    console.log("Rating received:", myRating);
      
    // add 3 seconds delay to try to simulate conflict write
    function sleep(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      // Busy-wait loop
      } 
    }     
    console.log("Start");
    sleep(2000); // Block execution for 3 second
    console.log("2 second later...");
          
    const maxRetries = 5; // Maximum number of retries
    let attempt = 0; // Current attempt number
    let success = false; // Track success of transaction
        
    while (attempt < maxRetries && !success) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
    
        // Find the restaurant document within the transaction
        const restaurant = await Restaurant.findById(id).session(session);
        if (!restaurant) {
          throw new Error('Restaurant not found');
        }
        
        // Calculate the new rating
        const { rating: currentRating, diners: currentDiners } = restaurant;
        const newRating = (((currentRating * currentDiners) + myRating) / (currentDiners + 1)).toFixed(1);
  
        // Update the restaurant Rating and Diners
        restaurant.rating = newRating;
        restaurant.diners = currentDiners + 1;
  
        // Save the updated restaurant within the transaction
        await restaurant.save({ session });
  
        // Commit the transaction
        await session.commitTransaction();
        success = true; // Mark success if commit is successful
  
        // Respond with the updated restaurant
        res.status(200).json(restaurant);
        return; // Exit the function on success
      } catch (error) {
        // Abort the transaction on error
        await session.abortTransaction();
        console.error(`Attempt ${attempt + 1} failed:`, error);
  
        // Retry if it's a transient error
        if (error.message.includes('WriteConflict') || error.code === 112) {
          attempt += 1; // Increment attempt
          console.log(`Retrying... (${attempt}/${maxRetries})`);
        } else {
          // If the error is not transient, respond with an error
          res.status(500).json({ message: 'Error updating restaurant', error });
          return;
        }
      } finally {
        // End the session
        session.endSession();
      }
    }
    // If all retries failed
    if (!success) {
        res.status(409).json({ message: 'Failed to update restaurant after multiple attempts' });
    }
});

module.exports = router;