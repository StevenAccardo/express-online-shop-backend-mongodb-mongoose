const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  // Orginally was allowing for an imageURL instead of an actual image, but this has been changed. This should be renamed at some point to reflect better.
  imageUrl: {
    type: String,
    required: true,
  },
  // Set up relation with the user model.
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('Product', productSchema);
