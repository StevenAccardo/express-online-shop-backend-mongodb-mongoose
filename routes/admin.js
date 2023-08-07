const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/auth');

const router = express.Router();

router.get('/add-product', isAuth, adminController.getAddProduct);

router.post('/add-product',[
    body('title', 'Title must be atleast 3 characters').isString().isLength({min: 3}).trim(),
    body('imageUrl', 'Image URL must be a URL.').isURL(),
    body('price', 'Price must be a decimal.').isFloat(),
    body('description', 'Description must be atleast 5 characters, and no more than 400 characters.').isLength({min: 5, max: 400}).trim()
],
isAuth, adminController.postAddProduct);

router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product',[
    body('title', 'Title must be atleast 3 characters').isString().isLength({min: 3}).trim(),
    body('imageUrl', 'Image URL must be a URL.').isURL(),
    body('price', 'Price must be a decimal.').isFloat(),
    body('description', 'Description must be atleast 5 characters, and no more than 400 characters.').isLength({min: 5, max: 400}).trim()
],
isAuth, adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;