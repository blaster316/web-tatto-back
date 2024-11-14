const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Usuario = require('./User'); // Importamos el modelo de Usuario

const Mensaje = sequelize.define('Mensaje', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_origen: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'USUARIO', // Referencia a la tabla 'USUARIO'
      key: 'ID',
    },
  },
  usuario_destino: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'USUARIO', // Referencia a la tabla 'USUARIO'
      key: 'ID',
    },
  },
  texto: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'MENSAJE',  // Nombre de la tabla
  timestamps: false,
});

// Asociaciones
Mensaje.belongsTo(Usuario, { foreignKey: 'usuario_origen', as: 'origen' }); // Asociar usuario_origen con Usuario
Mensaje.belongsTo(Usuario, { foreignKey: 'usuario_destino', as: 'destino' }); // Asociar usuario_destino con Usuario

module.exports = Mensaje;