const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Route to check if a user exists in the database
router.get('/exists/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const userExists = await User.exists({ username });
    if (userExists) {
      res.json("true");
    } else {
      res.json("false");
    }
  } catch (err) {
    res.status(500).json({ message: 'Error checking user existence', error: err });
  }
});

// route to get all users from the database
router.get('/', async (req, res) => {
    try {
        const getUsers = await User.find();
        res.json(getUsers);
    } catch (err) {
        res.status(500).json({message: 'Error fetching users', error: err});
    }
});

// route to add a user to the database
router.post('/', async (req, res) => {
    try {
      const { username } = req.body;
      const userExists = await User.exists({ username });
      if (userExists) {
        return res.status(409).json({ message: "username already exists. Please choose a different username" });
      }
      const newUser = new User({ username });
      const savedUser = await newUser.save();
      res.json(savedUser);
    } catch (err) {
      res.status(400).json({ message: 'Error storing user', error: err });
    }
  });


module.exports = router;
