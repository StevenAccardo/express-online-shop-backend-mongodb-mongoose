const User = require('../models/user')

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.postLogin = (req, res, next) => {
    User.findById('64c8679be6a2264d45e14339')
    // Storing the mongoose object of the user record returned into the request before going to routes, so that the user can be used, as it would if we had some sort of authentiation/authorization logic.
    .then(user => {
        req.session.isLoggedIn = true;
        req.session.user = user;
        // Normally do not need to call save() for the 
        req.session.save(err => {
            console.log(err)
            res.redirect('/');
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
