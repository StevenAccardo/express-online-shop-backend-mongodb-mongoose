const Product = require('../models/product')

exports.getProducts = (req, res, next) => {
    Product.fetchAll()
    .then(products => {
        res.render('shop/product-list', {
            prods: products,
            pageTitle: 'All Products',
            path: '/products'
        })
    })
    .catch(err => console.log(err))
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
    .catch(err => console.log(err))
}

exports.getIndex = (req, res, next) => {
    Product.fetchAll()
    .then(products => {
        res.render('shop/index', {
            prods: products,
            pageTitle: 'Shop',
            path: '/'
        })
    })
    .catch(err => console.log(err))
}

exports.getCart = (req, res, next) => {
    // Get cart associated with user
    req.user.getCart()
    .then(cartProducts => {
        res.render('shop/cart', {
            pageTitle: 'Your Cart',
            path: '/cart',
            products: cartProducts
        })
    })
    .catch(err => console.log(err))
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
    req.user.deleteItemFromCart(prodId)
    .then(result => {
        console.log('Product Removed from Cart.')
        res.redirect('/cart')
    })
    .catch(err => console.log(err));
}

exports.postOrder = (req, res, next) => {
    req.user.addOrder()
    .then(result => {
        res.redirect('/orders');
    })
    .catch(err => console.log(err));
}

exports.getOrders = (req, res, next) => {
    // Here we are asking sequelize to send us the products related to the orders as well. This is known as eager loading.
    req.user.getOrders()
    .then(orders => {
        res.render('shop/orders', {
            pageTitle: 'Your Orders',
            path: '/orders',
            orders
        })
    })
    .catch(err => console.log(err));
}
