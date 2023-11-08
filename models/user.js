const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        // Set up relation to the Product model.
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

// Adds a new product to a user's cart and saves it to the database.
userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    // Need to convert to strings in order to use strict equal because the _id is not actually of type string, even if the values are equal.
    return cp.productId.toString() === product._id.toString();
  });
  let newQuantity = 1;
  // Copy the cart items without mutating the original using the spread operator
  const updatedCartItems = [...this.cart.items];

  // If there was a matching cart item in the cart, then we just need to update the quantity of that item.
  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    // If cartProductIndex is -1 then there was no matching product already in the cart, so we will add a new cart item to the cart
    updatedCartItems.push({ productId: product._id, quantity: newQuantity });
  }

  const updatedCart = {
    items: updatedCartItems,
  };

  // Updates the cart property on the user document
  this.cart = updatedCart;
  // Updates the document in the DB
  return this.save();
};

// Removes a product from a user's cart and saves it to the database.
userSchema.methods.removeFromCart = function (productId) {
  // Filters all of the items that do not match the productId into a new array
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });

  // Assigns that new array without the product that matches the product id
  this.cart.items = updatedCartItems;
  // Updates the document in the DB
  return this.save();
};

// Deletes all products and quantities in the cart and saves it to the database.
userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  // Updates the document in the DB
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
