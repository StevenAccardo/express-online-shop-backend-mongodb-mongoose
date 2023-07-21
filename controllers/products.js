// Controllers can be split identically to routes, but they can also be split based on functionality. We will leverage

const Product = require('../models/product')

exports.getAddProduct = (req, res, next) => {
    // Method for sending static html files.
    // res.sendFile(path.join(rootDir, 'views', 'add-product.html'))

    res.render('add-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product'
    })
}

exports.postAddProduct = (req, res, next) => {
    const product = new Product(req.body.title)
    product.save();
    res.redirect('/');
}

exports.getProducts = (req, res, next) => {
    // res.sendFile(path.join(rootDir, 'views', 'shop.html'))
    Product.fetchAll((products) => {
        res.render('shop', {
            prods: products,
            pageTitle: 'Shop',
            path: '/'
        })
    })
}