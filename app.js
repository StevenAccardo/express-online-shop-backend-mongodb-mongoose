const path = require('path')

const express = require('express');
const bodyParser = require('body-parser');

const errorController = require('./controllers/error')

const app = express();

// Tells express what view engine we are using, and what file extensions to look for when using the res.render() method for creating an html page from our templating engine to send to the client.
app.set('view engine', 'ejs');
// Explicitly tells express where the views directory is located
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({extended: false}));
// Express middleware that allows us to server static files, such as css, from a directory, which we build out using the helper function and path.join. Now any html files that we send back that require supporting static files can be downloaded from this directory.
app.use(express.static(path.join(__dirname, 'public')))

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404)

app.listen(3000)