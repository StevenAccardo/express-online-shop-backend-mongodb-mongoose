const Product = require('../models/product')

exports.getProducts = (req, res, next) => {
    req.user.getProducts()
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
    // Leverages sequalize association helper methods to create a product that contains a foreign key that references the pk on the User table.
    req.user.createProduct({
        title,
        price,
        imageUrl,
        description
    })
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
    // Sequelize version of findById
    Product.findByPk(prodId)
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
    Product.findByPk(productId)
    .then(product => {
        product.title = title;
        product.price = price;
        product.imageUrl = imageUrl;
        product.description = description;
        // Sequelize method for updating a product.
        product.save();
    })
    .then(result => {
        console.log("Updated product!")
        res.redirect('/admin/products')
    })
    .catch(err => console.log(err))
}

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findByPk(prodId)
    .then(product => {
        // Sequelize version of delete
        return product.destroy()
    })
    .then(result => {
        console.log('Deleted Product.');
        res.redirect('/admin/products');
    })
    .catch(err => console.log(err))
}
