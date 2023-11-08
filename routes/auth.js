const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/signup', authController.getSignup);
router.get('/login', authController.getLogin);

router.post(
  '/signup',
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .custom((value, { req }) => {
      // Express validator will await the promise resolution. If the promise resolves then it pass the validation step. If the promise is rejected, as it will be if the if block is entered, then it will treat it as an invalid check, and show the error message passed to the .reject method.
      return User.findOne({ email: value }).then((userDoc) => {
        if (userDoc) {
          return Promise.reject(
            'E-mail already exists, please pick a different one.'
          );
        }
      });
    })
    .normalizeEmail({ gmail_remove_dots: false }),
  body(
    'password',
    'Please enter a password with only numbers and text and at least 5 characters.'
  )
    .isLength({ min: 5 })
    .trim(),
  body('confirmPassword')
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords have to match!');
      }
      return true;
    }),
  authController.postSignup
);

router.post(
  '/login',
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .normalizeEmail({ gmail_remove_dots: false }),
  body(
    'password',
    'Please enter a password with only numbers and text and at least 5 characters.'
  )
    .isLength({ min: 5 })
    .trim(),
  authController.postLogin
);

router.post('/logout', authController.postLogout);

// PASSWORD RESET FLOW HAS BEEN COMMENTED OUT AS IT RELIES ON SENDING EMAILS, AND I HAVE DECIDED NOT TO MOVE FORWARD WITH THIS DUE TO CONSTRAINTS PLACED ON SENDING EMAILS FROM GMAIL ACCOUNTS.

// router.get('/reset', authController.getReset);

// router.post('/reset', authController.postReset);

// router.get('/reset/:token', authController.getNewPassword);

// router.post('/new-password', authController.postNewPassword);

module.exports = router;
