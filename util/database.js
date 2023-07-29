const Sequalize = require('sequelize')

if (process.env.NODE_ENV !== 'production') { 
    require('dotenv').config(); 
}

// Create the ORM
const sequelize = new Sequalize(process.env.DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: 'mysql', 
    host: process.env.DB_HOST
})

module.exports = sequelize;