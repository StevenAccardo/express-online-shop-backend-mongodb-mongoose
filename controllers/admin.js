const Product = require('../models/product')
const mongodb = require('mongodb');

exports.getProducts = (req, res, next) => {
    Product.fetchAll()
    .then(products => {
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products'
        })
    })
    .catch(err => console.log(err))
}

exports.getAddProduct = (req, res, next) => {
    // Method for sending static html files.
    // res.sendFile(path.join(rootDir, 'views', 'add-product.html'))

    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false
    })
}

exports.postAddProduct = (req, res, next) => {
    const {title, imageUrl, description, price} = req.body;
    const product = new Product(title, price, imageUrl, description, null, req.user._id);
    product.save()
    .then(result => {
        console.log('Created Product!');
        res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
}

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }

    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        if (!product) {
            return res.redirect('/');
        }
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: editMode,
            product
        })
    })
    .catch(err => console.log(err))
}

exports.postEditProduct = (req, res, next) => {
    const {productId, title, imageUrl, description, price} = req.body;
    const product = new Product(title, price, imageUrl, description, productId)
    product.save()
    .then(result => {
        console.log("Updated product!")
        res.redirect('/admin/products')
    })
    .catch(err => console.log(err))
}

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.deleteById(prodId)
    .then(() => {
        res.redirect('/admin/products');
    })
    .catch(err => console.log(err))
}
