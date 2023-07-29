const path = require('path')

const express = require('express');
const bodyParser = require('body-parser');

const errorController = require('./controllers/error');
const sequelize = require('./util/database');
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');

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
    User.findByPk(1)
    // Storing the sequalize object of the user record returned into the request before going to routes, so that the user can be used, as it would if we had some sort of authentiation/authorization logic.
    .then(user => {
        req.user = user;
        next();
    })
    .catch(err => console.log(err))
})

app.use('/admin', adminRoutes);
// middleware that routes to shopRoute modulate for anything starting with '/'
app.use(shopRoutes);

// A route that could be exported, but handles any invalid routes.
app.use(errorController.get404)

// Sets up table relations for sequalize
Product.belongsTo(User, {constraints: true, onDelete: 'CASCADE'});
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
// { through: CartItem} tells sequelize how the Cart and Products are related, using our CartItem model.
Cart.belongsToMany(Product, { through: CartItem});
Product.belongsToMany(Cart, { through: CartItem});
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem})
Product.belongsToMany(Order, { through: OrderItem})

// Allows sequalize to create tables, or check if they are created, at app start.
// force: true will make necesarry changes to database if there are changes made to a table since last run, new relations, or etc. This is destructive, so use only in dev.
// sequelize.sync({ force: true})
sequelize.sync()
.then(result => {
    // We know this user will have ID 1 because it is a test user that we create below.
    return User.findByPk(1)
    // console.log(result)
})
// Creates a dummy user for testing purposes.
.then(user => {
    if (!user) {
        return User.create({ name: 'Steve', email: 'test@test.com'})
    }
    // variable returned in a then() block are automatically wrapped in a promise, if they aren't a promise already.
    return user
})
.then(user => {
    // Creates a cart for our dummy user
    // console.log(user);
    user.createCart();
})
.then(cart => {
    app.listen(3000);
})
.catch(err => {
    console.log(err)
})