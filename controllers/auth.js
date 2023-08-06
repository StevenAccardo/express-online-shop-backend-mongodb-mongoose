const bcrypt = require('bcryptjs');

const User = require('../models/user')

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
        errorMessage: message
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
        errorMessage: message
    });
};

exports.postSignup = (req, res, next) => {
    const {email, password, confirmPassword} = req.body;
    User.findOne({email})
    .then(userDoc => {
        if (userDoc) {
            req.flash('error', 'E-mail already exists.')
            return res.redirect('/signup');
        }
        return bcrypt.hash(password, 12)
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
            res.redirect('/login');
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err))
};

exports.postLogin = (req, res, next) => {
    const {email, password} = req.body;
    User.findOne({email})
    // Storing the mongoose object of the user record returned into the request before going to routes, so that the user can be used, as it would if we had some sort of authentiation/authorization logic.
    .then(user => {
        if (!user) {
            // Stores something temporarily in a session until it is used, then it is removed from the session.
            req.flash('error', 'Invalid email or password.')
            return res.redirect('/login')
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
            req.flash('error', 'Invalid email or password.');
            res.redirect('/login');
        })
        // Catch only triggered if there was an error, not just if the passwords don't match.
        .catch(err => {
            console.log(err);
            res.redirect('/login')
        })
    })
    .catch(err => console.log(err))
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) {
            console.log(err)
        }
        res.redirect('/')
    })
};
