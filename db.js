const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('DB_APP', 'sa', 'contrasenabd', {
    host: 'localhost',
    dialect: 'mssql',
    dialectModule: require('tedious'),
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

module.exports = sequelize;