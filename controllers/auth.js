const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator')

const User = require('../models/user');
require('dotenv').config();

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: process.env.SENDGRID_API_KEY
    }
}))

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
            confirmPassword: ''
        }
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
        oldInput: {email: '', password: ''}
    });
};

exports.postSignup = (req, res, next) => {
    const {email, password, confirmPassword} = req.body;
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422)
        .render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {email, password, confirmPassword}
        }); ;
    }
    bcrypt.hash(password, 12)
    .then(hashedPassword => {
        const user = new User({
            email,
            password: hashedPassword,
            cart: { items: [] }
        })

        return user.save()
    })
    .then(() => {
        console.log('New user created.');
        res.redirect('/login')
        return transporter.sendMail({
            to: email,
            from: 'accardo.steven@gmail.com',
            subject: 'Signup succeeded!',
            html: '<h1>You successfully signed</h1>'
        })
    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postLogin = (req, res, next) => {
    const {email, password} = req.body;
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422)
        .render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: {email, password}
        });
    }
    User.findOne({email})
    // Storing the mongoose object of the user record returned into the request before going to routes, so that the user can be used, as it would if we had some sort of authentiation/authorization logic.
    .then(user => {
        if (!user) {
            return res.status(422)
            .render('auth/login', {
                path: '/login',
                pageTitle: 'Login',
                errorMessage: 'Invalid email or password.',
                oldInput: {email, password}
            });
        }
        bcrypt.compare(password, user.password)
        .then(doMatch => {
            if (doMatch) {
                req.session.isLoggedIn = true;
                req.session.user = user;
                // Normally do not need to call save() for the 
                return req.session.save(err => {
                    console.log(err)
                    res.redirect('/')
                })
            }
            return res.status(422)
            .render('auth/login', {
                path: '/login',
                pageTitle: 'Login',
                errorMessage: 'Invalid email or password.',
                oldInput: {email, password}
            });
        })
        // Catch only triggered if there was an error, not just if the passwords don't match.
        .catch(err => {
            console.log(err);
            res.redirect('/login')
        })
    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) {
            console.log(err)
        }
        res.redirect('/')
    })
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset')
        }
        // Buffer stores the bytes in hexidecimal values, so toString needs us to tell it what format it is converting from into ascii characters.
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
        .then(user => {
            if (!user) {
                req.flash('error', 'No account with that email found.')
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        })
        .then(() => {
            res.redirect('/');
            transporter.sendMail({
                to: req.body.email,
                from: 'accardo.steven@gmail.com',
                subject: 'Password Reset',
                html: `
                    <p>You requested a password reset.</p>
                    <p>Click this <a href="http://localhost:3000/reset/${token}">link<a/> to set a new password.
                `
            });
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    })
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
        let message = req.flash('error');
        if (message.length > 0) {
            message = message[0];
        } else {
            message = null;
        }
        res.render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'New Password',
            errorMessage: message,
            userId: user._id.toString(),
            passwordToken: token
        });
    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
    const {password: newPassword, userId, passwordToken} = req.body;
    let resetUser;

    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId
    })
    .then(user => {
        resetUser = user;
        return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
    })
    .then(result => {
        res.redirect('/login');
    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};
