const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  restaurant_Id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant', 
    required: true 
  },
  user_Id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  restaurant: { type: String, required: true },
  party: { type: Number, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  note: { type: String, required: false }
});

module.exports = mongoose.model('Reservation', ReservationSchema)
