const Sequalize = require('sequelize');
const sequalize = require('../util/database');

const Order = sequalize.define('order', {
    id: {
        type: Sequalize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    }
})

module.exports = Order;