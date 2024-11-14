const bcrypt = require('bcryptjs');
const sequelize = require('./db'); // Asegúrate de que la ruta sea correcta
const User = require('./models/User'); // Asegúrate de que la ruta sea correcta

(async () => {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida.');

    const users = await User.findAll();

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;
      await user.save();
      console.log(`Contraseña actualizada para el usuario: ${user.email}`);
    }

    console.log('Todas las contraseñas han sido actualizadas exitosamente.');
  } catch (error) {
    console.error('Error al actualizar las contraseñas:', error);
  } finally {
    await sequelize.close(); // Cierra la conexión a la base de datos
  }
})();

//node updatePasswords.js