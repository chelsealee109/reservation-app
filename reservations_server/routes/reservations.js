const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const mongoose = require('mongoose');

// route to add a reservation to the database
/*
router.post('/', async (req, res) => {
    try {
      const { username, restaurant, party, date, time, note } = req.body;

      // Look up the user by username
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Look up the restaurant by name
      const restaurantDoc = await Restaurant.findOne({ name: restaurant });
      if (!restaurantDoc) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      const newReservation = new Reservation({ 
	user_Id: user._id, 
        restaurant_Id: restaurantDoc._id,
        restaurant, party, date, time, note });
      const savedReservation = await newReservation.save();
      res.json(savedReservation);
    } catch (err) {
      res.status(400).json({ message: 'Error storing reservation', error: err });
    }
  });
*/

router.post('/', async (req, res) => {
  // Ideally, we want to use serilzable isolation level for reservation table consistency
  // to make sure we are not reserving a table for multiple users for the same restaurant and time slot
  // However, MongoDB does not support  serializable isolation level
  // Instead, MongoDB uses a multi-document transaction model with an isolation level called "snapshot isolation" for its transactions.
  // MongoDB took a snapshot of the database that are being read. Upon a write, if MongoDB detects that the database has changed and
  // from the snapshot being taken, it would reject the write and reported write conflict error
  // retry 3 times if table is locked
  const MAX_RETRIES = 3;
  let attempt = 0;
  // change the maxTables allowed per timeslot to any number you like. Setting it to 1 to ease verification
  maxTables = 1;
  // add 2 seconds delay to try to cause collison
  function sleep(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      // Busy-wait loop
    }
  }

  console.log("Start");
  sleep(2000); // Block execution for 1 second
  console.log("2 second later...");

  const session = await mongoose.startSession();

  try {
    while (attempt < MAX_RETRIES) {
      let success = 1;
      try {
        // start the session for snapshot
        session.startTransaction();

        const { username, restaurant, party, date, time, note } = req.body;
        // use a RestaurantLock_dummy entry for the purpose of locking the reservation table, since MongoDB would only
        // detects write conflict if it touches the same schema.
        // For the RestaurantLock_dummy entry, I created a note with string of either "UnLock or Lock"
        // The default state is UnLock. The usage is first to read this entry. If it is Lock , then abort and retry
        // If it UnLock , then write to the table to change it to Lock. Here is where the consistency checking comes in
        // It could have read UnLock earlier. However, another user might have gained the table lock by setting the note to Lock.
        // MongoDB detects that there is a snapshot change and will reject the write to the table and causes retry until it gains
        // and establish the lock
        // Check if the reservation table is locked
        const reservationLock = await Reservation.findOne({ restaurant: 'RestaurantLock_dummy' }).session(session);
        console.log(username, reservationLock);
        if (!reservationLock) {
          console.log("reservation with RestaurantLock_dummy not found");
          await session.abortTransaction();
          return res.status(404).json({ message: 'reservation not found' });
        }
        if (reservationLock.note === 'Lock') {
          await session.abortTransaction();
          console.log("table was locked by someone", username);
          //attempt++;
          //success = 0;
          continue;
          //return res.status(404).json({ message: 'reservation Table is Locked by other user' });
        }
        else {
          // Update the note field to 'Lock'
          console.log("Locking reservation table", username);
          reservationLock.note = 'Lock';

          try {
          //  console.log("ReservationLock before saving:", reservationLock);
            await reservationLock.save({ session });
            console.log("Reservation successfully locked.", username);
          } catch (error) {
            console.error("Error during save:", error.message);
            if (error.errors) {
              console.error("Validation errors:", error.errors);
            }
            await session.abortTransaction();
            attempt++;
            //success = 0;
            continue;
            //return res.status(500).json({ message: "Failed to lock reservation table", error: error.message });
          }

        }
        // End of locking the reservation table
        if (success === 1) {
            // Look up the user by username
            const user = await User.findOne({ username }).session(session);
            if (!user) {
              console.log('Cant find user', username);
              throw new Error('User not found'); // Throw an error to trigger retry
            }

            // Look up the restaurant by name
            const restaurantDoc = await Restaurant.findOne({ name: restaurant }).session(session);
            if (!restaurantDoc) {
              console.log('Cant find restaurant', username);
              throw new Error('Restaurant not found'); // Throw an error to trigger retry
            }

            // Count existing reservations for the restaurant, date, and time
            const reservationCount = await Reservation.countDocuments({
              restaurant_Id: restaurantDoc._id,
              date,
              time,
            }).session(session);

            console.log('reservation count', username,reservationCount);
            if (reservationCount >= maxTables) {
            // exceeded the allowable table counts. Release the lock and quit.
              reservationLock.note = 'UnLock';
              await reservationLock.save();
              await session.abortTransaction();
              console.log('Maximum table exceeded', username);
              // throw new Error('No tables available for this time slot'); // Trigger retry or fail
              //return res.status(500).json({ message: "No tables available for this time slot", error: error.message });
              return res.status(409).json({ message: "No tables available for this time slot" });
            }

            // Create a new reservation
            const newReservation = new Reservation({
              user_Id: user._id,
              restaurant_Id: restaurantDoc._id,
              restaurant,
              party,
              date,
              time,
              note,
            });

            await newReservation.save({ session });

            // Commit the transaction
            await session.commitTransaction();
            reservationLock.note = 'UnLock';
            await reservationLock.save();
            res.json(newReservation);
            return; // Exit the loop and return the response
        }
        console.log("going to next while loop iteration", username);
      } catch (err) {
        await session.abortTransaction();

        if (err.name === 'MongoError' && err.code === 112) {
          // Retry for write conflicts
          attempt++;
          if (attempt === MAX_RETRIES) {
            return res.status(409).json({ message: 'Transaction failed after multiple attempts' });
          }
        } else {
          // Handle non-write-conflict errors
          return res.status(400).json({ message: err.message });
        }
      }
    }
  } catch (err) {
    res.status(500).json({ message: 'Unexpected error', error: err });
  } finally {
    session.endSession(); // Ensure the session is ended
  }
});

// route to get a reservation from the database
router.get('/', async (req, res) => {
   try {
      const { username } = req.query;
      console.log('Received username:', username);

      // Look up the user by username
      const user = await User.findOne({ username });
      console.log(user);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
       const getReservations = await Reservation.find({ user_Id: user._id });
      console.log(getReservations);
       res.json(getReservations);
   } catch (err) {
       res.status(500).json({message: 'Error fetching reservations', error: err});
   }
   });

// route to edit reservations
router.patch('/edit/:id', async (req, res) => {
    const {party, date, time, note} = req.body;
    try {
        const reservation = await Reservation.findByIdAndUpdate(req.params.id, {party, date, time, note}, {new:true});
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        res.status(200).json(reservation);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// route to delete reservations
router.delete('/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndDelete(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        res.status(200).json({message: "Reservation deleted!"});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// route to sort by date
router.get('/sorted-date', async(req, res) => {
    const {sort, username} = req.query;
    let sortOrder = 1;
    if (sort === 'desc') {
        sortOrder = -1;
    }
    const user = await User.findOne({ username });
    console.log(user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    try {
        //const sortOrder = req.query.sort === 'desc' ? -1 : 1;
        const sortedReservations = await Reservation.find({ user_Id: user._id }).sort({date: sortOrder, time: sortOrder});  // prepared statement
        res.status(200).json(sortedReservations);
    } catch (err) {
        res.status(500).json({ message: 'Error sorting reservations', error: err });
    }
});

// route to sort by party number
router.get('/sorted-party', async(req, res) => {
    const {sort, username} = req.query;
    let sortOrder = 1;
    if (sort === 'desc') {
        sortOrder = -1;
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    try {
        //const sortOrder = req.query.sort === 'desc' ? -1 : 1;
        const sortedReservations = await Reservation.find({ user_Id: user._id }).sort({party: sortOrder});  // prepared statement
        res.status(200).json(sortedReservations);
    } catch (err) {
        res.status(500).json({ message: 'Error sorting reservations', error: err });
    }
});

// route to search restaurant names
router.get('/search', async(req, res) => {
    const query = req.query.q|| '';
    const username = req.query.username|| '';
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    try {
        const filteredReservations = await Reservation.find ({  //mongo query to find keywords
          user_Id: user._id,  
          restaurant: {$regex: `^${query}`, $options: 'i'},
        });
        res.status(200).json(filteredReservations);
    } catch (err) {
        res.status(500).json({ message: 'Error searching restaurants', error: err });
    }
});

// route to search reservation by date range
router.get('/searchByDate', async (req, res) => {
  const { username, startDate, endDate } = req.query;
  console.log("searchByDate is called");
  console.log(username, startDate, endDate);
  if (!username || !startDate || !endDate) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  try {
    const reservations = await Reservation.find({
      user_Id: user._id,  
      date: { $gte: new Date(startDate).setHours(0, 0, 0, 0), $lte: new Date(endDate).setHours(23, 59, 59, 999)  },
    });

    res.json(reservations);
  } catch (err) {
    console.error("Error fetching reservations:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
