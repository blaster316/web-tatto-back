const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const sequelize = require('./db');
const moment = require('moment');
const { Op } = require('sequelize');
const User = require('./models/User');
const Publicacion = require('./models/Publicacion');
const Comuna = require('./models/Comuna')
const Cita = require('./models/Cita')
const Mensaje = require('./models/Mensaje')

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configurar multer para almacenar las imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads')); // Usar path.join
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`); // Renombrar el archivo con la fecha y extensión
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/; // Tipos de archivo permitidos
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb('Error: Tipo de archivo no permitido.'); // Manejo de errores de tipo de archivo
  },
});

// Endpoint para mostrar las comunas en una lista
app.get('/comunas', async (req, res) => {
  try {
    const comunas = await Comuna.findAll();
    res.json(comunas);
  } catch (error) {
    console.error('Error al obtener comunas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para ingresar un usuario de tipo usuario
app.post('/register', async (req, res) => {
  const { rut, dv, nombre, apellido, usuario, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const rol_id = 3; // Siempre asignar rol_id como 3
  const estado_id = 1; // Siempre asignar estado_id como 1

  try {
    const user = await User.create({
      rut,
      dv,
      nombre: nombre || null,
      apellido: apellido || null,
      usuario: usuario || null,
      email,
      password: hashedPassword,
      rol_id,
      estado_id,
    });

    res.status(201).json({ id: user.id, email: user.email, rol_id: user.rol_id });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ error: 'Error del servidor', details: error.message });
  }
});

// Endpoint para registrar un usuario de tipo tatuador
app.post('/registertatuador', async (req, res) => {
  const { rut, dv, nombre, apellido, usuario, email, password, telefono, direccion, direccion_url, comuna_id } = req.body;
  console.log('Datos recibidos:', req.body); // Verifica que comuna_id se reciba correctamente

  const hashedPassword = await bcrypt.hash(password, 10);
  const rol_id = 2;
  const estado_id = 2;
  try {
    const user = await User.create({
      rut,
      dv,
      nombre: nombre || null,
      apellido: apellido || null,
      usuario: usuario || null,
      email,
      password: hashedPassword,
      telefono: telefono || null,
      direccion: direccion || null,
      direccion_url: direccion_url || null,
      comuna_id: comuna_id || null,
      rol_id,
      estado_id,
    });
    res.status(201).json({ id: user.id, email: user.email, rol_id: user.rol_id });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ error: 'Error del servidor', details: error.message });
  }
});

// Endpoint para el inicio de sesión
app.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ where: { email, rol_id: role } });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user.id, rol: user.rol_id }, 'tu_secreto_aqui', { expiresIn: '1h' });

    return res.json({ message: 'Usuario conectado', token, rol_id: user.rol_id, userId: user.id });

  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para obtener los datos del usuario por ID
app.get('/user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      usuario: user.usuario,
      email: user.email,
      rol_id: user.rol_id,
      estado_id: user.estado_id,
      texto: user.texto,
      foto: user.foto,
      foto_tatuador: user.foto_tatuador,
    });
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para actualizar los datos del usuario por ID
app.put('/user/:id', upload.single('foto'), async (req, res) => {
  const userId = req.params.id;
  const { nombre, apellido, usuario, texto, foto_tatuador } = req.body;

  try {
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar datos del usuario
    user.nombre = (nombre === undefined || nombre === null || nombre.trim() === '') ? null : nombre.trim();
    user.apellido = (apellido === undefined || apellido === null || apellido.trim() === '') ? null : apellido.trim();
    user.usuario = usuario || user.usuario;
    user.texto = (texto === undefined || texto === null || texto.trim() === '') ? null : texto.trim();
    user.foto_tatuador = foto_tatuador || user.foto_tatuador;

    // Si se subió una nueva foto, actualizarla
    if (req.file) {
      user.foto = path.join('uploads', req.file.filename); // Guardar la ruta de la nueva imagen
    }

    await user.save();

    res.json({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      usuario: user.usuario,
      email: user.email,
      rol_id: user.rol_id,
      estado_id: user.estado_id,
      texto: user.texto,
      foto: user.foto,
      foto_tatuador: user.foto_tatuador,
    });
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para subir la foto de perfil
app.put('/user/:id/photo', upload.single('foto'), async (req, res) => {
  const userId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo.' });
  }

  try {
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    user.foto = path.join('uploads', req.file.filename); // Guardar la ruta de la imagen
    await user.save();

    res.json({ foto: user.foto });
  } catch (error) {
    console.error('Error al actualizar la foto de perfil:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para subir una nueva publicación
app.post('/user/:id/publicacion', upload.single('imagen'), async (req, res) => {
  const userId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo.' });
  }

  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const fechaCreacion = moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss.SSS');

    const publicacion = await Publicacion.create({
      usuario_id: userId,
      foto: path.join('uploads', req.file.filename), // Guardar la ruta de la imagen
      mensaje: req.body.texto || null,
      fecha_creacion: fechaCreacion
    });

    res.status(201).json({
      id: publicacion.id,
      usuario_id: publicacion.usuario_id,
      foto: publicacion.foto,
      mensaje: publicacion.mensaje,
      fecha_creacion: publicacion.fecha_creacion
    });
  } catch (error) {
    console.error('Error al crear la publicación:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para mostrar publicaciones
app.get('/perfilpublicacion/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10); // Obtener userId desde la URL

  try {
    const publicaciones = await Publicacion.findAll({ where: { usuario_id: userId } });
    res.json(publicaciones);
  } catch (error) {
    console.error('Error al obtener publicaciones:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para obtener tatuadores en el home
app.get('/tatuadores', async (req, res) => {
  try {
    const tatuadores = await User.findAll({
      where: { rol_id: 2 },
      attributes: ['id', 'nombre', 'apellido', 'foto_tatuador'],
    });

    res.json(tatuadores);
  } catch (error) {
    console.error('Error al obtener tatuadores:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para obtener las citas del tatuador por ID
app.get('/citas/:tatuadorId', async (req, res) => {
  const tatuadorId = req.params.tatuadorId;

  try {
    const citas = await Cita.findAll({
      where: { tatuador_id: tatuadorId },
      attributes: ['fecha', 'hora'],
    });

    if (!citas || citas.length === 0) {
      return res.status(404).json({ error: 'No se encontraron citas para este tatuador' });
    }

    const citasFormateadas = citas.map(cita => {
      const fechaOriginal = new Date(cita.fecha);

      // Asegúrate de que cita.hora sea una cadena.
      const horaString = typeof cita.hora === 'string' ? cita.hora.split('.')[0] : cita.hora.toISOString().split('T')[1].split('.')[0];

      // Crear objeto Date para la hora, asegurando que no se pierda el valor.
      const [hours, minutes] = horaString.split(':'); // Dividir la hora en horas y minutos
      const horaOriginal = new Date(fechaOriginal); // Copiar la fecha original
      horaOriginal.setHours(parseInt(hours, 10), parseInt(minutes, 10)); // Establecer horas y minutos

      // Ajustar la fecha
      fechaOriginal.setDate(fechaOriginal.getDate() + 1);

      // Resta 3 horas para corregir la hora
      horaOriginal.setHours(horaOriginal.getHours() - 3);

      // Formatear la hora
      const horaFormateada = `${horaOriginal.getUTCHours().toString().padStart(2, '0')}:${horaOriginal.getUTCMinutes().toString().padStart(2, '0')}`;

      return {
        fecha: fechaOriginal.toISOString().split('T')[0], // YYYY-MM-DD
        hora: horaFormateada, // HH:mm
      };
    });

    res.json(citasFormateadas);
  } catch (error) {
    console.error('Error al obtener las citas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para crear una nueva cita
app.post('/user/:id/cita', upload.single('foto'), async (req, res) => {
  const usuarioId = req.params.id;
  const { tatuadorId, mensaje, fecha, hora } = req.body;
  const foto = req.file ? path.join('uploads', req.file.filename) : null;

  console.log('Cuerpo de la solicitud:', req.body);
  console.log('Archivo subido:', req.file);

  try {
    const usuario = await User.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const tatuador = await User.findOne({ where: { id: tatuadorId, rol_id: 2 } });
    if (!tatuador) {
      return res.status(404).json({ error: 'Tatuador no encontrado' });
    }

    if (!fecha) {
      return res.status(400).json({ error: 'La fecha es obligatoria.' });
    }
    if (!hora) {
      return res.status(400).json({ error: 'La hora es obligatoria.' });
    }

    const fechaCita = moment(fecha).startOf('day').format('YYYY-MM-DD');
    const fechaCreacion = moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss.SSS');

    const cita = await Cita.create({
      tatuador_id: tatuadorId,
      usuario_id: usuarioId,
      mensaje: mensaje || null,
      foto: foto, // Guardar la ruta correcta
      fecha: fechaCita,
      hora: hora,
      estado: 0,
      fecha_creacion: fechaCreacion,
    });

    res.status(201).json(cita);
  } catch (error) {
    console.error('Error al crear la cita:', error);
    res.status(500).json({ error: `Error del servidor: ${error.message}` });
  }
});

// Endpoint para obtener los chats de un usuario (con mensajes de origen y destino)
app.get('/chats/:usuarioId', async (req, res) => {
  const usuarioId = req.params.usuarioId;

  try {
    // Obtener todos los mensajes entre el usuario y otros usuarios
    const mensajes = await Mensaje.findAll({
      where: {
        [Op.or]: [
          { usuario_origen: usuarioId },
          { usuario_destino: usuarioId },
        ],
      },
      include: [
        {
          model: User,
          as: 'origen', // Alias definido en el modelo Mensaje
          attributes: ['id', 'nombre', 'foto'],
        },
        {
          model: User,
          as: 'destino', // Alias definido en el modelo Mensaje
          attributes: ['id', 'nombre', 'foto'],
        },
      ],
      order: [['fecha_creacion', 'ASC']], // Ordenar los mensajes por fecha
    });

    // Crear un objeto para almacenar los chats sin duplicados
    const chats = new Map();

    mensajes.forEach((mensaje) => {
      const usuarioOrigen = mensaje.origen;
      const usuarioDestino = mensaje.destino;

      // Si el mensaje es del usuario actual, el otro usuario es el destinatario
      if (usuarioOrigen.id !== parseInt(usuarioId)) {
        chats.set(usuarioOrigen.id, {
          id: usuarioOrigen.id,
          nombre: usuarioOrigen.nombre,
          foto: usuarioOrigen.foto ? `http://localhost:3000/uploads/${usuarioOrigen.foto}` : null, // Concatenamos la URL base
          lastMessage: mensaje.texto, // Último mensaje enviado
        });
      }

      // Si el mensaje es del otro usuario hacia el usuario actual, entonces el usuarioOrigen es el destinatario
      if (usuarioDestino.id !== parseInt(usuarioId)) {
        chats.set(usuarioDestino.id, {
          id: usuarioDestino.id,
          nombre: usuarioDestino.nombre,
          foto: usuarioDestino.foto ? `http://localhost:3000/uploads/${usuarioDestino.foto}` : null, // Concatenamos la URL base
          lastMessage: mensaje.texto, // Último mensaje enviado
        });
      }
    });

    // Convertir el Map en un array y devolver la respuesta
    const uniqueChats = Array.from(chats.values());

    res.json(uniqueChats);
  } catch (error) {
    console.error('Error al obtener los chats:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para obtener los mensajes entre dos usuarios
app.get('/messages/:usuarioId/:chatId', async (req, res) => {
  const usuarioId = req.params.usuarioId;
  const chatId = req.params.chatId;

  try {
    // Obtener los mensajes entre el usuario actual y el chat seleccionado
    const mensajes = await Mensaje.findAll({
      where: {
        [Op.or]: [
          { usuario_origen: usuarioId, usuario_destino: chatId },
          { usuario_origen: chatId, usuario_destino: usuarioId },
        ],
      },
      include: [
        {
          model: User,
          as: 'origen', // Alias definido en el modelo Mensaje
          attributes: ['id', 'nombre', 'foto'],
        },
        {
          model: User,
          as: 'destino', // Alias definido en el modelo Mensaje
          attributes: ['id', 'nombre', 'foto'],
        },
      ],
      order: [['fecha_creacion', 'ASC']], // Ordenar los mensajes por fecha
    });

    res.json(mensajes); // Devolver los mensajes
  } catch (error) {
    console.error('Error al obtener los mensajes:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Sincronizar la base de datos y arrancar el servidor
(async () => {
  await sequelize.sync();
  app.listen(3000, () => {
    console.log('Servidor en el puerto 3000');
  });
})();