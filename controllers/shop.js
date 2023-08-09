const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

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

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
    .then(order => {
        if (!order) {
            return next(new Error('No order found.'))
        }

        if (order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error('Unauthorized'))
        }

        const invoiceName = `invoice-${orderId}.pdf`;
        const invoicePath = path.join('data', 'invoices', invoiceName);

        // This creates a readable stream.
        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);

        // This will write it to the server directory, so it isn't just sent to the client, but you could also do that if you didn't want to store it.
        pdfDoc.pipe(fs.createWriteStream(invoicePath))
        pdfDoc.pipe(res);

        pdfDoc.fontSize(26).text('Invoice', {underline: true});
        pdfDoc.text('---------------------');
        let totalPrice = 0;

        order.products.forEach(prod => {
            totalPrice += prod.product.price * prod.quantity;
            pdfDoc.fontSize(14).text(`${prod.product.title} - ${prod.quantity} x $${prod.product.price}`)
        });
        pdfDoc.text('---------------------');
        pdfDoc.fontSize(20).text(`Total Price: $${totalPrice}`);

        // Tells node that you are done writing, so the file can be pipe to each place above.
        pdfDoc.end();


        // Reading files like this is ok for small files, but not large files as it will use up your servers memory if you get a lot of requests that have large files.
        // fs.readFile(invoicePath, (err, data) => {
        //     if (err) {
        //         return next(err);
        //     }
        //     res.setHeader('Content-Type', 'application/pdf');
        //     res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);
        //     res.send(data);
        // })


        // // This is good for sending static files already stored on the server.
        // const file = fs.createReadStream(invoicePath);
        // res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);
        // // Pipes data from a read stream to a writeable stream. The response object is a writeable stream. This allows us not to have to read the entire file content to memory before sending it to the browser.
        // // We can now simulatneously write the data to the browser as we read it, one chunk at a time.
        // // Large advantage for big files.
        // file.pipe(res);

    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
}