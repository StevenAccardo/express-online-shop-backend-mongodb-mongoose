const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 1;

exports.getProducts = (req, res, next) => {
  // The current page the user is
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numberOfProducts) => {
      totalItems = numberOfProducts;
      // skip() will skip a certain amount of documents to return, which assists in pagination.
      // Here we take the current page, subtract one, and multiply by the amount of items per page. This will essentially skip however many documents there are up to and including the users current page.
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        // The current page number
        currentPage: page,
        // Determines if there will be a next page shown on pagination buttons
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        // Determines if there will be a previous page shown on pagination buttons
        hasPreviousPage: page > 1,
        // The next page number
        nextPage: page + 1,
        // The previous page number
        previousPage: page - 1,
        // The last page, determined by roounding up from division. So if there is a float, then that means the division was not equal and there will be another item at the very least on that last page.
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Similar to the getProducts controller above
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numberOfProducts) => {
      totalItems = numberOfProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  // Get cart associated with user
  req.user
    // Tell mongoose to populate the documents referenced in the schema under cart.items.productId
    .populate('cart.items.productId')
    .then((user) => {
      res.render('shop/cart', {
        pageTitle: 'Your Cart',
        path: '/cart',
        products: user.cart.items,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      req.user.addToCart(product);
      res.redirect('/cart');
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(() => {
      console.log('Product Removed from Cart.');
      res.redirect('/cart');
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => {
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: user.cart.items.map((item) => ({
          quantity: item.quantity,
          // Using the _doc property that mongoose exposes for us to access the data stored in the document being referenced. We then copy that into a new object with the spread operator.
          product: { ...item.productId._doc },
        })),
      });
      return order.save();
    })
    .then(() => {
      // After we create the order, we clear out the user's cart.
      return req.user.clearCart();
    })
    // Then redirect them to the orders route/page.
    .then(() => res.redirect('/orders'))
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then((orders) => {
      res.render('shop/orders', {
        pageTitle: 'Your Orders',
        path: '/orders',
        orders,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Creates a PDF invoice to be saved to the file system
exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error('No order found.'));
      }

      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'));
      }

      const invoiceName = `invoice-${orderId}.pdf`;
      const invoicePath = path.join('data', 'invoices', invoiceName);

      // This creates a readable stream.
      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);

      // This will write it to the server directory, so it isn't just sent to the client, but you could also do that if you didn't want to store it.
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      // This will pipe the PDF to the response.
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text('Invoice', { underline: true });
      pdfDoc.text('---------------------');
      let totalPrice = 0;

      order.products.forEach((prod) => {
        totalPrice += prod.product.price * prod.quantity;
        pdfDoc
          .fontSize(14)
          .text(
            `${prod.product.title} - ${prod.quantity} x $${prod.product.price}`
          );
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
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
