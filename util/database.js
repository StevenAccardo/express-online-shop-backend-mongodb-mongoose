const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

if (process.env.NODE_ENV !== 'production') { 
    require('dotenv').config(); 
}
const mongoConnect = (callback) => {
    // MongoDB connection string
    MongoClient.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.46tvxte.mongodb.net/?retryWrites=true&w=majority`)
    // Returns promise that resolves to a client object for using the DB.
    .then(client => {
        console.log('Connected!');
        // We connect to a certain db, and then save that connection to the DB in a variable available in the module.
        _db = client.db('shop');
        callback(client);
    })
    .catch(err => {
        console.log(err);
        throw err;
    })
}

// Exportable function that allows us to connect to the database in other modules. MongoDB handles the connection pooling behind the scenes.
const getDb = () => {
    if (_db) {
        return _db;
    }

    throw 'No database found';
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;