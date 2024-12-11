const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: Number, required: true },
  rating: { type: Number, required: true },
  diners: { type: Number, required: true }
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);