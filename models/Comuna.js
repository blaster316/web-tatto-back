const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Comuna = sequelize.define('Comuna', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'COMUNA',
  timestamps: false,
});

module.exports = Comuna;