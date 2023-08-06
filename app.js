const path = require('path')

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// Used for 
const session = require('express-session');
// Used for storing sessions in the db instead of just in memory for longer durability.
const MongoDBStore = require('connect-mongodb-session')(session);
// Used for flashing data onto our session for limited time use without storing on the session permenantly. In this case we will use it for sending error messages.
const flash = require('connect-flash');


const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.46tvxte.mongodb.net/shop?retryWrites=true&w=majority`

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
})

// Tells express what view engine we are using, and what file extensions to look for when using the res.render() method for creating an html page from our templating engine to send to the client.
app.set('view engine', 'ejs');
// Explicitly tells express where the views directory is located
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({extended: false}));
// Express middleware that allows us to server static files, such as css, from a directory, which we build out using the helper function and path.join. Now any html files that we send back that require supporting static files can be downloaded from this directory.
app.use(express.static(path.join(__dirname, 'public')))
// Initiliazes a session property that saves to our mongodb session collection.
app.use(session({secret: process.env.SECRET, resave: false, saveUninitialized: false, store}))
// Creates the flash middleware which puts the flash method on the req object. Once a key is created and stored in the session, once it is retreived from the session, it is removed from the session.
app.use(flash());

// Even though we are storing the user informatin in the mongodDB session collection, we have to still pull the user info from the shop collection because that is the collection that understands our relations and allows us to use necesarry methods.
app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
    // Storing the mongoose object of the user record returned into the request before going to routes, so that the user can be used, as it would if we had some sort of authentiation/authorization logic.
    .then(user => {
        req.user = user;
        next();
    })
    .catch(err => console.log(err))
})

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    next();
})
app.use('/admin', adminRoutes);
// // middleware that routes to shopRoute modulate for anything starting with '/'
app.use(shopRoutes);
app.use(authRoutes);

// A route that could be exported, but handles any invalid routes.
app.use(errorController.get404)

mongoose.connect(MONGODB_URI)
.then(() => {
    app.listen(3000);
})
.catch(err => console.log(err));