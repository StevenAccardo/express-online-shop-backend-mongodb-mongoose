const Product = require('../models/product')

exports.getProducts = (req, res, next) => {
    Product.findAll()
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
    Product.findByPk(prodId)
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
    Product.findAll()
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
    .then(cart => {
        return cart.getProducts().then(cartProducts => {
            res.render('shop/cart', {
                pageTitle: 'Your Cart',
                path: '/cart',
                products: cartProducts
            })
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err))
}

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    let fetchedCart;
    let newQuantity = 1;
    req.user
    .getCart()
    .then(cart => {
        fetchedCart = cart;
        return cart.getProducts({ where: { id: prodId } });
    })
    .then(products => {
        let product;
        if (products.length > 0) {
            product = products[0];
        }

        if (product) {
            const oldQuantity = product.cartItem.quantity;
            newQuantity = oldQuantity + 1;
            return product;
        }
        return Product.findByPk(prodId);
    })
    .then(product => {
        return fetchedCart.addProduct(product, {
            through: { quantity: newQuantity }
        });
    })
    .then(() => {
        res.redirect('/cart');
    })
    .catch(err => console.log(err));
};
  

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.getCart()
    .then(cart => {
        return cart.getProducts({ where: { id: prodId } });
    })
    .then(products => {
        const product = products[0];
        return product.cartItem.destroy();
    })
    .then(result => {
        console.log('Product Removed from Cart.')
        res.redirect('/cart')
    })
    .catch(err => console.log(err));
}

exports.postOrder = (req, res, next) => {
    let fetchedCart;
    req.user.getCart()
    .then(cart => {
        fetchedCart = cart;
        return cart.getProducts()
    })
    .then(products => {
        return req.user.createOrder()
        .then(order => {
            // We have to use map here because we are wanting to transfer the quanity of each product in the cart over to the order, so the user gets the same quanntity of products in the order as they had in the cart.
            // The quantity is stored in the cartItem table, so we have to pull it out, and make a new array of obects that have the quantity on them, in order for the quantity to be populated over to the orderItem table.
            return order.addProducts(products.map(product => {
                product.orderItem = { quantity: product.cartItem.quantity }
                return product;
            }))
        })
        .catch(err => console.log(err));
    })
    .then(result => {
        return fetchedCart.setProducts(null)
    })
    .then(result => {
        res.redirect('/orders');
    })
    .catch(err => console.log(err));
}

exports.getOrders = (req, res, next) => {
    // Here we are asking sequelize to send us the products related to the orders as well. This is known as eager loading.
    req.user.getOrders({include: ['products']})
    .then(orders => {
        res.render('shop/orders', {
            pageTitle: 'Your Orders',
            path: '/orders',
            orders
        })
    })
    .catch(err => console.log(err));
}
