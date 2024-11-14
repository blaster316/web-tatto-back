const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Publicacion = sequelize.define('Publicacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'USUARIO',
      key: 'ID',
    },
  },
  mensaje: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  foto: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  valoracion: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'PUBLICACION',
  timestamps: false,
});

module.exports = Publicacion;

