const Product = require('../models/product')
const Order = require('../models/order')

exports.getProducts = (req, res, next) => {
    Product.find()
    .then(products => {
        res.render('shop/product-list', {
            prods: products,
            pageTitle: 'All Products',
            path: '/products'
        })
    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        res.render('shop/product-detail', {
            product: product,
            pageTitle: product.title,
            path: '/products'
        })
    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getIndex = (req, res, next) => {
    Product.find()
    .then(products => {
        res.render('shop/index', {
            prods: products,
            pageTitle: 'Shop',
            path: '/'
        })
    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getCart = (req, res, next) => {
    // Get cart associated with user
    req.user
    .populate('cart.items.productId')
    .then(user => {
        res.render('shop/cart', {
            pageTitle: 'Your Cart',
            path: '/cart',
            products: user.cart.items
        })
    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
    .then(product => {
        req.user.addToCart(product)
        res.redirect('/cart');
    })
};
  

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.removeFromCart(prodId)
    .then(() => {
        console.log('Product Removed from Cart.')
        res.redirect('/cart')
    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postOrder = (req, res, next) => {

    req.user.populate('cart.items.productId')
    .then(user => {
        const order = new Order({
            user: {
                email: req.user.email,
                userId: req.user
            },
            products: user.cart.items.map(item => ({quantity: item.quantity, product: {...item.productId._doc}}))
        })
        return order.save();
    })
    .then(() => {
        return req.user.clearCart();
    })
    .then(() => res.redirect('/orders'))
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
    .then(orders => {
        res.render('shop/orders', {
            pageTitle: 'Your Orders',
            path: '/orders',
            orders
        })
    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}
