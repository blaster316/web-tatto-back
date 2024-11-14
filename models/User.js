const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  rut: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dv: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  usuario: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  direccion_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  comuna_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  estado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  texto: { 
    type: DataTypes.STRING,
    allowNull: true,
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  foto_tatuador: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'USUARIO',
  timestamps: false,
});

module.exports = User;