const path = require('path')

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config()

const errorController = require('./controllers/error');
const User = require('./models/user');

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

app.use((req, res, next) => {
    User.findById('64c8679be6a2264d45e14339')
    // Storing the mongoose object of the user record returned into the request before going to routes, so that the user can be used, as it would if we had some sort of authentiation/authorization logic.
    .then(user => {
        req.user = user;
        next();
    })
    .catch(err => console.log(err))
})

app.use('/admin', adminRoutes);
// // middleware that routes to shopRoute modulate for anything starting with '/'
app.use(shopRoutes);

// A route that could be exported, but handles any invalid routes.
app.use(errorController.get404)

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.46tvxte.mongodb.net/shop?retryWrites=true&w=majority`)
.then(() => {
    User.findOne()
    .then(user => {
        if (!user) {
            const user = new User({
                name: 'Steve',
                email: 'test@test.com',
                cart: {
                    items: []
                }
            })
            user.save()
        }
    })
    app.listen(3000)
})
.catch(err => console.log(err));