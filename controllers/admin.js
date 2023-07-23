const Product = require('../models/product')

exports.getAddProduct = (req, res, next) => {
    // Method for sending static html files.
    // res.sendFile(path.join(rootDir, 'views', 'add-product.html'))

    res.render('admin/add-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product'
    })
}

exports.postAddProduct = (req, res, next) => {
    const {title, imageUrl, description, price} = req.body;
    const product = new Product(title, imageUrl, description, price)
    product.save();
    res.redirect('/');
}

exports.getProducts = (req, res, next) => {
    // res.sendFile(path.join(rootDir, 'views', 'shop.html'))
    Product.fetchAll((products) => {
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: 'admin/products'
        })
    })
}
