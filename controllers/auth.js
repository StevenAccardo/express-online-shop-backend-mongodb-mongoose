const crypto = require('crypto');

const bcrypt = require('bcryptjs');
// const nodemailer = require('nodemailer');
// const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const User = require('../models/user');

// const transporter = nodemailer.createTransport(
//   sendgridTransport({
//     auth: {
//       api_key: process.env.SENDGRID_API_KEY,
//     },
//   })
// );

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
};

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    // Once used, this 'error' key and value will be removed from the session.
    errorMessage: message,
    oldInput: { email: '', password: '' },
  });
};

exports.postSignup = (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password, confirmPassword },
    });
  }
  // Hash the user's password
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      // Create the new user document in the User collection
      // New user will have an empty cart
      const user = new User({
        email,
        password: hashedPassword,
        cart: { items: [] },
      });

      return user.save();
    })
    .then(() => {
      console.log('New user created.');
      res.redirect('/login');
      // Commenting this out as not planning on using e-mail notifications with this project
      // return transporter.sendMail({
      //     to: email,
      //     from: '<email_here',
      //     subject: 'Signup succeeded!',
      //     html: '<h1>You successfully signed</h1>'
      // })
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password },
    });
  }
  // Query for the user document that has a matching e-mail.
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password.',
          oldInput: { email, password },
        });
      }
      // Compare hashed passwords to confirm password is correct.
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            // Set properties on the session
            req.session.isLoggedIn = true;
            req.session.user = user;

            // Save
            return req.session.save((err) => {
              if (err) {
                console.log(err);
              }
              res.redirect('/');
            });
          }
          // If passwords don't match
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
            oldInput: { email, password },
          });
        })
        // Catch only triggered if there was an error, not just if the passwords don't match.
        .catch((err) => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  // Delete the session in
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect('/');
  });
};

// PASSWORD RESET FLOW HAS BEEN COMMENTED OUT AS IT RELIES ON SENDING EMAILS, AND I HAVE DECIDED NOT TO MOVE FORWARD WITH THIS DUE TO CONSTRAINTS PLACED ON SENDING EMAILS FROM GMAIL ACCOUNTS.

// exports.getReset = (req, res, next) => {
//   let message = req.flash('error');
//   if (message.length > 0) {
//     message = message[0];
//   } else {
//     message = null;
//   }
//   res.render('auth/reset', {
//     path: '/reset',
//     pageTitle: 'Reset Password',
//     errorMessage: message,
//   });
// };

// exports.postReset = (req, res, next) => {
//   crypto.randomBytes(32, (err, buffer) => {
//     if (err) {
//       console.log(err);
//       return res.redirect('/reset');
//     }
//     // Buffer stores the bytes in hexidecimal values, so toString needs us to tell it what format it is converting from into ascii characters.
//     const token = buffer.toString('hex');
//     User.findOne({ email: req.body.email })
//       .then((user) => {
//         if (!user) {
//           req.flash('error', 'No account with that email found.');
//           return res.redirect('/reset');
//         }
//         user.resetToken = token;
//         user.resetTokenExpiration = Date.now() + 3600000;
//         return user.save();
//       })
//       .then(() => {
//         res.redirect('/');
//         transporter.sendMail({
//           to: req.body.email,
//           from: 'accardo.steven@gmail.com',
//           subject: 'Password Reset',
//           html: `
//                     <p>You requested a password reset.</p>
//                     <p>Click this <a href="http://localhost:3000/reset/${token}">link<a/> to set a new password.
//                 `,
//         });
//       })
//       .catch((err) => {
//         console.log(err);
//         const error = new Error(err);
//         error.httpStatusCode = 500;
//         return next(error);
//       });
//   });
// };

// exports.getNewPassword = (req, res, next) => {
//   const token = req.params.token;
//   User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
//     .then((user) => {
//       let message = req.flash('error');
//       if (message.length > 0) {
//         message = message[0];
//       } else {
//         message = null;
//       }
//       res.render('auth/new-password', {
//         path: '/new-password',
//         pageTitle: 'New Password',
//         errorMessage: message,
//         userId: user._id.toString(),
//         passwordToken: token,
//       });
//     })
//     .catch((err) => {
//       console.log(err);
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//     });
// };

// exports.postNewPassword = (req, res, next) => {
//   const { password: newPassword, userId, passwordToken } = req.body;
//   let resetUser;

//   User.findOne({
//     resetToken: passwordToken,
//     resetTokenExpiration: { $gt: Date.now() },
//     _id: userId,
//   })
//     .then((user) => {
//       resetUser = user;
//       return bcrypt.hash(newPassword, 12);
//     })
//     .then((hashedPassword) => {
//       resetUser.password = hashedPassword;
//       resetUser.resetToken = undefined;
//       resetUser.resetTokenExpiration = undefined;
//       return resetUser.save();
//     })
//     .then((result) => {
//       res.redirect('/login');
//     })
//     .catch((err) => {
//       console.log(err);
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//     });
// };
