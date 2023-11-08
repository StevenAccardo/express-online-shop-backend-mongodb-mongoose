// Leverage env vars on process.env
require('dotenv').config();
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
// Import ORM lib
const mongoose = require('mongoose');
// Used for working with sessions
const session = require('express-session');
// Used for storing sessions in the DB instead of just in memory for longer durability. Uses the connect-mongodb-session library and the express-session library to accomplish this.
const MongoDBStore = require('connect-mongodb-session')(session);
// Used for flashing data onto our session for limited time use without storing on the session permenantly. In this case we will use it for sending error messages.
const flash = require('connect-flash');
// Used  for handling multipart/form-data which in this server we are using to handle storing our images
const multer = require('multer');
const cors = require('cors');

const port = process.env.PORT ?? 4000;
const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.46tvxte.mongodb.net/shop?retryWrites=true&w=majority`;

const app = express();

// Connects to the session collection in the DB
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions',
});

// Configures how we want multer to store our image files.
const storageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}-${new Date().toISOString()}`);
  },
});

const fileFilter = (req, file, cb) => {
  // If the incoming file mimetype is of these types then we execute a callback that will tell multer to save the file, and if not, then it will not save the file.
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Tells express what view engine we are using, and what file extensions to look for when using the res.render() method for creating an HTML page from our templating engine to send to the client.
app.set('view engine', 'ejs');
// Explicitly tells express where the views directory is located
app.set('views', 'views');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
// Parses multipart/form-data. Here we are telling it to expect a single file with the name of image coming on the request.
app.use(multer({ storage: storageEngine, fileFilter }).single('image'));
// Express middleware that allows us to server static files, such as CSS, from a directory, which we build out using path.join and the exposed __dirname variable. Now any HTML files that we send back that require supporting static files can be downloaded from this directory.
app.use(express.static(path.join(__dirname, 'public')));
// Same as above, but we allow the HTML files to reference images stored in the image directory instead of the public directory.
app.use('/images', express.static(path.join(__dirname, 'images')));
// Initiliazes a session property that saves to our mongodb session collection.
// Here we pass in the secret that is used to sign the session, we don't require the session to be resaved, and we won't save it if its uninitialized, and finally we pass in our MongoDB store collection instance so we don't have to use an in memory store.
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store,
  })
);
// Creates the flash middleware which puts the flash method on the req object. Once a key is created and stored in the session, once it is retreived from the session, it is removed from the session.
app.use(flash());

// Storing the user instance returned from the query onto the request object before going to routes, so that the user can be used, as it would if we had some sort of authentiation/authorization logic.
// This can get split off into a middleware and imported.
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

// Using the res.locals property to store whether the user is logged in.
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});
app.use('/admin', adminRoutes);
// // middleware that routes to shopRoute modulate for anything starting with '/'
app.use(shopRoutes);
app.use(authRoutes);

// Has to come before the catch all right below.
app.use('/500', errorController.get500);

// A catch all that will render an error page to the client if the error was not caused by the server.
app.use(errorController.get404);

// A custom error handler that will redirect the client to the /500 route, which will in turn render a 500 server error page.
app.use((error, req, res, next) => {
  console.log(error);
  res.redirect('/500');
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(port, () => console.log(`Server is listening on port: ${port}`));
  })
  .catch((err) => console.log(err));
