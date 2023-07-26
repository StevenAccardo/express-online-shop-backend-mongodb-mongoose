const fs = require('fs')
const path = require('path')

const rootDir = require('../util/path')
const p = path.join(rootDir, 'data', 'cart.json')

module.exports = class Cart {
    static addProduct(id, productPrice) {
        // Fetch the previous cart
        fs.readFile(p, (err, fileContent) => {
            let cart = {products: [], totalPrice: 0};
            if (!err) {
                cart = JSON.parse(fileContent);
            }
            // Analyze the cart => Find the existing product
            const existingProductIndex = cart.products.findIndex(prod => prod.id === id);
            const existingProduct = cart.products[existingProductIndex]

            //Add new product/ increase quanity
            let updatedProduct;
            if (existingProduct) {
                updatedProduct = { ...existingProduct };
                updatedProduct.qty = updatedProduct.qty + 1;
                cart.products = [...cart.products]
                cart.products[existingProductIndex] = updatedProduct
            } else {
                updatedProduct = { id, qty: 1 };
                cart.products = [...cart.products, updatedProduct]
            }
            cart.totalPrice = cart.totalPrice + +productPrice;
            // Save cart back to file
            fs.writeFile(p, JSON.stringify(cart), err => {
                console.log(err);
            })
        })
        
    }

    static deleteProduct(id, productPrice) {
        fs.readFile(p, (err, fileContent) => {
            if (err) {
                return;
            }

            const updatedCart = { ...JSON.parse(fileContent)};
            const product = updatedCart.products.find(prod => prod.id === id);
            if (!product) {
                return;
            }
            updatedCart.totalPrice = updatedCart.totalPrice - productPrice * product.qty;
            updatedCart.products = updatedCart.products.filter(prod => prod.id !== id);

            // Save cart back to file
            fs.writeFile(p, JSON.stringify(updatedCart), err => {
                console.log(err);
            })
        })
    }

    static getCart(cb) {
        fs.readFile(p, (err, fileContent) => {
            const cart = JSON.parse(fileContent);
            if (err) {
                cb(null);
            } else {
                cb(cart);
            }
        })
    }
}