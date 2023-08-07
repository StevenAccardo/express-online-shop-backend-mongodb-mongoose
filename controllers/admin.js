const {validationResult} = require('express-validator');

const Product = require('../models/product')

exports.getProducts = (req, res, next) => {
    // Since this is an admin route, we only show products that were created by the user/shop admin.
    Product.find({userId: req.user._id})
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
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: false,
        errorMessage: null 
    })
}

exports.postAddProduct = (req, res, next) => {
    const {title, imageUrl, description, price} = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/edit-product',
            editing: false,
            hasError: true,
            errorMessage: errors.array()[0].msg,
            product: {
                title,
                imageUrl,
                price,
                description
            }
        })
    }

    const product = new Product({ title, price, imageUrl, description, userId: req.user });
    product.save()
    .then(() => {
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
            product,
            hasError: false,
            errorMessage: null
        })
    })
    .catch(err => console.log(err))
}

exports.postEditProduct = (req, res, next) => {
    const {productId, title, imageUrl, description, price} = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            errorMessage: errors.array()[0].msg,
            product: {
                title,
                imageUrl,
                price,
                description,
                _id: productId
            }
        })
    }

    Product.findById(productId)
    .then(product => {
        // This blocks users who didn't create the product from editing the product. This is an extra protection to not returning the products in the view.
        if (product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/')
        }

        product.title = title;
        product.price = price;
        product.description = description;
        product.imageUrl = imageUrl;
        return product.save();
    })
    .then(result => {
        console.log("Updated product!")
        res.redirect('/admin/products')
    })
    .catch(err => console.log(err))
}

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    // Only delete the product from the db if both the product id and the user id on the product match the request. Stops users from deleting products that they didn't create. This is in addition to 
    Product.deleteOne({_id: prodId, userId: req.body._id})
    .then(() => {
        res.redirect('/admin/products');
    })
    .catch(err => console.log(err))
}
