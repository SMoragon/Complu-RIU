"use strict";

const fs = require("node:fs");

// Clase para conectar con la BD. Recibe un pool de conexiones ya inicializado como argumento.
class DAO {
  constructor(pool) {
    this.pool = pool;
  }

  //update system configuration.
  update_config(icono, config, callback) {
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err);
      } else {
        var sql =
          "UPDATE sistema SET nombre=?, direccion=?, url_instagram=?, correo=?";
        if(icono){
          sql += ", icono=?, icono_type=?";
        }
        sql += " WHERE id = 1"
        connection.query(sql, config, callback);
        connection.release();
      }
    })
  }

  //get system configuration.
  get_config_info(callback) {
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err);
      } else {
        const sql = "SELECT * FROM sistema WHERE id = 1";
        connection.query(sql, callback);
        connection.release();
      }
    })
  }

  /* Funcion que, dado los datos de una instalación, lo inserte en la bases de datos*/
  insertar_instalacion(instalacion, callback) {
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err);
      } else {
        const sql =
          "Insert Into Instalaciones (nombre, horario_apertura, horario_cierre, tipo_reserva, aforo, imagen, imagen_tipo) VALUES (?,?,?,?,?,?,?)";
        connection.query(sql, instalacion, callback);
        connection.release();
      }
    })
  }

  // search installation function
  buscarInstalacion(dato, callback) {
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err);
      } else {
        var sql;
        if (dato === "") {
          sql = "SELECT * FROM Instalaciones ORDER BY nombre";
        } else {
          sql = "SELECT * FROM Instalaciones WHERE nombre LIKE '%" + dato + "%' OR tipo_reserva LIKE '%" + dato + "%' OR aforo LIKE '%" + dato + "%' ORDER BY nombre;";
        }
        connection.query(sql, callback);
        connection.release();
      }
    });
  }

  //update installation params.
  modificarInstalacion(id, imagen, dato, callback) {
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err);
      } else {
        var sql;
        if (imagen) {
          sql = "UPDATE Instalaciones SET nombre=?, horario_apertura=?, horario_cierre=?, tipo_reserva=?, aforo=?, imagen=?, imagen_tipo=? WHERE id=" + id + ";"
        } else {
          sql = "UPDATE Instalaciones SET nombre=?, horario_apertura=?, horario_cierre=?, tipo_reserva=?, aforo=? WHERE id=" + id + ";"
        } 
        connection.query(sql, dato, callback);
        connection.release();
      }
    });
  }

  // delete installation
  eliminarInstalacion(id, callback) {
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err);
      } else {
        const sql = "DELETE FROM Instalaciones WHERE id=?"
        connection.query(sql, [id], callback);
        connection.release();
      }
    });
  }

  // get an lists of installations names
  obtenerNombreInstalacion(callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err);
      } else {
        const sql = "SELECT nombre FROM Instalaciones"
        connection.query(sql, callback);
        connection.release();
      }
    });
  };

  /* Función que, dado un correo y una contraseña válidos, inserta un usuario en
    la base de datos, para que pase a estar registrado. */
  registrarUsuario(datos, callback) {
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err);
      } else {
        const sql =
          "Insert Into usuarios (nombre, apellidos, correo, contrasenia, facultad, curso, grupo, imagen_perfil, es_admin, validado) VALUES (?,?,?,?,?,?,?,?,?,?)";

        connection.query(sql, datos, callback);
        connection.release();
      }
    });
  }

  /* Función que, dado un correo válido, comprueba si ya existe un usuario con
    ese correo o no (ideal para validar en el register que un usuario tiene ya
    ese correo vinculado a su cuenta, para evitar múltiples cuentas con un mismo
    correo) */
  buscarUsuario(correo, callback) {
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err);
      } else {
        const sql = "Select * From usuarios Where correo=?";
        connection.query(sql, correo, callback);
        connection.release();
      }
    });
  }

  // update user to validate user
  validarUsuario(id, callback){
    this.pool.getConnection((err, connection)=>{
      if(err){
        callback(err);
      }else{
        const sql = "UPDATE usuarios SET validado = 1 WHERE id = ?"
        connection.query(sql, id, callback);
        connection.release();
      }
    })
  }

  // delete user
  eliminarUsuario(id, callback){
    this.pool.getConnection((err, connection)=>{
      if(err){
        callback(err);
      }else{
        const sql = "DELETE FROM usuarios WHERE id = ?"
        connection.query(sql, id, callback);
        connection.release();
      }
    })
  }

  // get list of non-validate users
  obtenerUsuariosNoValidatos(callback){
    this.pool.getConnection((err, connection)=>{
      if(err){
        callback(err);
      }else{
        const sql = "SELECT u.id, u.nombre, apellidos, correo, f.nombre as facultadUser, curso, grupo, imagen_perfil FROM usuarios u JOIN facultades f ON f.id=u.facultad WHERE validado=0"
        connection.query(sql, callback);
        connection.release();
      }
    })
  }

  // get a list of faculties
  obtenerFacultades(callback) {
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        const sql = "Select * From facultades";
        connection.query(sql, callback);
        connection.release();
      }
    })
  }

  // get a list of faculties by their name
  obtenerFacultadesPorNombre(name, callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        name = `%${name}%`;
        const sql = "SELECT DISTINCT * FROM facultades WHERE nombre LIKE ?";
        connection.query(sql, [name], callback);
        connection.release();
      }
    })
  }

  // get a list of faculties by their user name
  obtenerFacultadesPorUsuarioNombre(user, callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        user = `%${user}%`;
        const sql = "SELECT DISTINCT f.id as id, f.nombre as nombre FROM facultades f JOIN usuarios u ON u.facultad=f.id WHERE u.nombre LIKE ?";
        connection.query(sql, [user], callback);
        connection.release();
      }
    })
  }

  // get a list of faculties by their user last name
  obtenerFacultadesPorUsuarioApellido(user, callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        user = `%${user}%`;
        const sql = "SELECT DISTINCT f.id as id, f.nombre as nombre FROM facultades f JOIN usuarios u ON u.facultad=f.id WHERE u.apellidos LIKE ?";
        connection.query(sql, [user], callback);
        connection.release();
      }
    })
  }

  // get a list of users that belongs a faculty providing faculty id
  obtenerFacultadesListaUsuario(id, callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        const sql = "SELECT u.id as id, u.nombre as nombre, apellidos, correo, curso, grupo FROM facultades f JOIN usuarios u ON u.facultad=f.id WHERE f.id = ?";
        connection.query(sql, [id], callback);
        connection.release();
      }
    })
  }

  // obtains a faculty statistics
  obtenerEstadisticaFacultad(id,callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        const sql = "SELECT i.nombre as label ,COUNT(i.id) as counter FROM reservas r JOIN usuarios u ON r.id_reservante=u.id JOIN facultades f ON f.id = u.facultad JOIN instalaciones i ON r.id_instalacion = i.id WHERE f.id = ? GROUP BY i.id";
        connection.query(sql, [id], callback);
        connection.release();
      }
    })
  }

  // obtains a list of user by faculty name.
  obtenerListaUsuarioPorFaculdad(facultad, callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        facultad = `%${facultad}%`
        const sql = "SELECT u.id as id, u.nombre as nombre, apellidos, correo, curso, grupo, imagen_perfil, f.nombre as facultadUser, es_admin FROM facultades f JOIN usuarios u ON u.facultad=f.id WHERE f.nombre like ?";
        connection.query(sql, [facultad], callback);
        connection.release();
      }
    })
  }

  // get a list of users by their email
  obtenerListaUsuarioPorCorreo(correo, callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        correo = `%${correo}%`
        const sql = "SELECT u.id as id, u.nombre as nombre, apellidos, correo, curso, grupo, imagen_perfil, f.nombre as facultadUser, es_admin FROM facultades f JOIN usuarios u ON u.facultad=f.id WHERE correo like ?";
        connection.query(sql, [correo], callback);
        connection.release();
      }
    })
  }

  // get a list of users by their name
  obtenerListaUsuarioPorNombre(nombre, callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        nombre = `%${nombre}%`
        const sql = "SELECT u.id as id, u.nombre as nombre, apellidos, correo, curso, grupo, imagen_perfil, f.nombre as facultadUser, es_admin FROM facultades f JOIN usuarios u ON u.facultad=f.id WHERE u.nombre like ?";
        connection.query(sql, [nombre], callback);
        connection.release();
      }
    })
  }

  // get a list of users by their last name
  obtenerListaUsuarioPorApellido(apellido, callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        apellido = `%${apellido}%`
        const sql = "SELECT u.id as id, u.nombre as nombre, apellidos, correo, curso, grupo, imagen_perfil, f.nombre as facultadUser, es_admin FROM facultades f JOIN usuarios u ON u.facultad=f.id WHERE apellidos like ?";
        connection.query(sql, [apellido], callback);
        connection.release();
      }
    })
  }

  // get history of the user giving an user id as params.
  obtenerHistorialUsuario(id,callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        const sql = "SELECT i.nombre as nombre, fecha_reserva, hora_inicio, hora_fin, asistentes FROM reservas r JOIN instalaciones i ON r.id_instalacion=i.id WHERE id_reservante = ?";
        connection.query(sql, [id], callback);
        connection.release();
      }
    })
  }

  // get statistic of users giving an user id as params.
  obtenerEstadisticaUsuario(id,callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        const sql = "SELECT i.nombre as label ,COUNT(i.id) as counter FROM reservas r JOIN usuarios u ON r.id_reservante=u.id JOIN instalaciones i ON r.id_instalacion = i.id WHERE u.id = ? GROUP BY i.id";
        connection.query(sql, [id], callback);
        connection.release();
      }
    })
  }

  // update the user to admin user.
  updateToAdminUser(id, callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        const sql = "UPDATE usuarios SET es_admin = 1 WHERE id = ?";
        connection.query(sql, id, callback);
        connection.release();
      }
    })
  }

  // get a list of installation by their name
  obtenerInstalacionPorNombre(nombre,callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        nombre = `%${nombre}%`
        const sql = "SELECT * FROM instalaciones WHERE nombre LIKE ?";
        connection.query(sql, [nombre], callback);
        connection.release();
      }
    })
  }

  // get list of installation history.
  obtenerHistorialInstalacion(id,callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        const sql = "SELECT u.nombre as nombre, fecha_reserva, hora_inicio, hora_fin, asistentes FROM reservas r JOIN usuarios u ON r.id_reservante=u.id WHERE r.id_instalacion = ?";
        connection.query(sql, [id], callback);
        connection.release();
      }
    })
  }

  // get list of books by user name
  obtenerReservaPorNombreUsuario(nombre,callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        const sql = "SELECT r.id as id, CONCAT(u.nombre, ' ', u.apellidos) as usuario, correo, i.nombre as instalacion, fecha_reserva, hora_inicio, hora_fin, asistentes FROM reservas r JOIN usuarios u ON r.id_reservante=u.id JOIN instalaciones i ON r.id_instalacion = i.id WHERE u.nombre like ?";
        nombre = `%${nombre}%`
        connection.query(sql, [nombre], callback);
        connection.release();
      }
    })
  }

  // get list of books by user last name
  obtenerReservaPorApellidoUsuario(apellido,callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        const sql = "SELECT r.id as id, CONCAT(u.nombre, ' ', u.apellidos) as usuario, correo, i.nombre as instalacion, fecha_reserva, hora_inicio, hora_fin, asistentes FROM reservas r JOIN usuarios u ON r.id_reservante=u.id JOIN instalaciones i ON r.id_instalacion = i.id WHERE u.apellidos like ?";
        apellido = `%${apellido}%`
        connection.query(sql, [apellido], callback);
        connection.release();
      }
    })
  }

  // get list of book by installation name.
  obtenerReservaPorNombreInstalacion(nombre,callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        const sql = "SELECT r.id as id, CONCAT(u.nombre, ' ', u.apellidos) as usuario, correo, i.nombre as instalacion, fecha_reserva, hora_inicio, hora_fin, asistentes FROM reservas r JOIN usuarios u ON r.id_reservante=u.id JOIN instalaciones i ON r.id_instalacion = i.id WHERE i.nombre like ?";
        nombre = `%${nombre}%`
        connection.query(sql, [nombre], callback);
        connection.release();
      }
    })
  }

  // get list of book by faculty´s name
  obtenerReservaPorNombreFacultad(nombre,callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        const sql = "SELECT r.id as id, CONCAT(u.nombre, ' ', u.apellidos) as usuario, correo, i.nombre as instalacion, fecha_reserva, hora_inicio, hora_fin, asistentes FROM reservas r JOIN usuarios u ON r.id_reservante=u.id JOIN facultades f ON u.facultad = f.id JOIN instalaciones i ON r.id_instalacion = i.id WHERE f.nombre like ?";
        nombre = `%${nombre}%`
        connection.query(sql, [nombre], callback);
        connection.release();
      }
    })
  }

  // get list of book in the giving time ranges.
  obtenerReservaPorRangoTemporal(fechas,callback){
    this.pool.getConnection((err, connection) => {
      if (err) {
        callback(err)
      }
      else {
        const sql = "SELECT r.id as id, CONCAT(u.nombre, ' ', u.apellidos) as usuario, correo, i.nombre as instalacion, fecha_reserva, hora_inicio, hora_fin, asistentes FROM reservas r JOIN usuarios u ON r.id_reservante=u.id JOIN instalaciones i ON r.id_instalacion = i.id WHERE fecha_reserva >= ? AND fecha_reserva <= ?";
        connection.query(sql, fechas, callback);
        connection.release();
      }
    })
  }

  // send message
  enviarMensaje(datos, callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {
        const sql= "Insert into correos (id_emisor, id_receptor, asunto, contenido, leido, fecha_envio) VALUES (?,?,?,?,?,?)"
        connection.query(sql, datos, callback);
        connection.release();
      }
    })
  }

  // get menssage
  obtenerMensajes(idReceptor, callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {
        const sql= "Select c.id, c.id_emisor, c.id_receptor, c.asunto, c.contenido, c.leido, c.fecha_envio, u.nombre, u.nombre, u.apellidos, u.correo, u.imagen_perfil from correos c join usuarios u on c.id_emisor=u.id Where id_receptor=? order by c.fecha_envio Desc"
        connection.query(sql, idReceptor, callback);
        connection.release();
      }
    })
  }

   obtenerMensajesFiltrados(idReceptor,filter_by, callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {
        const sql= "Select c.id, c.id_emisor, c.id_receptor, c.asunto, c.contenido, c.leido, c.fecha_envio, u.nombre, u.apellidos, u.correo, u.imagen_perfil from correos c join usuarios u on c.id_emisor=u.id Where id_receptor=? AND (c.asunto LIKE ? OR c.contenido LIKE ? OR c.fecha_envio LIKE ? OR u.nombre LIKE ? OR u.apellidos LIKE ? OR  u.correo LIKE ?) order by c.fecha_envio Desc"
        filter_by="%"+filter_by+"%"
        connection.query(sql,[idReceptor,filter_by,filter_by,filter_by,filter_by,filter_by,filter_by],callback);
        connection.release();
      }
    })
  }

  obtenerMensajesSinLeer(idReceptor, callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {
        const sql= "Select Count(*) As sinLeer from correos Where id_receptor=? AND leido=0"
        connection.query(sql, idReceptor, callback);
        connection.release();
      }
    })
  }

  marcarComoLeido(idMensaje, callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {
        const sql= "Update correos Set leido=1 Where id=?"
        connection.query(sql, idMensaje, callback);
        connection.release();
      }
    })
  }

  reservarInstalacion(datos, callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {
        const sql= "Insert into reservas (id_reservante, id_instalacion, fecha_reserva, hora_inicio, hora_fin,asistentes) VALUES (?,?,?,?,?,?)"
        connection.query(sql, datos, callback);
        connection.release();
      }
    })
  }

  reservarListaEspera(datos, callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {
        const sql= "Insert into lista_espera (id_reservante, id_instalacion, fecha_reserva, hora_inicio, hora_fin,fecha_envio_reserva,asistentes) VALUES (?,?,?,?,?,?,?)"
        connection.query(sql, datos, callback);
        connection.release();
      }
    })
  }

  obtenerReservasSolape(idInst,fechaRes,horaIni,horaFin, callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {                                                                
        const sql= "Select COUNT(*) as solapes From reservas Where id_instalacion=? And fecha_reserva=? And ((hora_inicio>=? And hora_inicio <?) Or (hora_inicio<? And hora_fin>?))"
        connection.query(sql, [idInst, fechaRes,horaIni,horaFin,horaIni,horaIni ], callback);
        connection.release();
      }
    })
  }

  obtenerReservasUsuario(id_reservante, callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {
        const sql= "Select r.id as id_reserva, r.fecha_reserva, r.hora_inicio, r.hora_fin, r.asistentes, i.nombre, i.imagen, i.imagen_tipo from reservas r Join instalaciones i On r.id_instalacion=i.id  Where r.id_reservante=? Order By r.fecha_reserva Desc"
        connection.query(sql, id_reservante, callback);
        connection.release();
      }
    })
  }

  obtenerReservasId(id_reserva, callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {
        const sql= "Select * from reservas Where id=?"
        connection.query(sql, id_reserva, callback);
        connection.release();
      }
    })
  }

  obtenerReservasInstalacion(id_instalacion,fecha_res, callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {
        const sql= "Select * from reservas Where id_instalacion=? And fecha_reserva=?"
        connection.query(sql, [id_instalacion,fecha_res], callback);
        connection.release();
      }
    })
  }

  obtenerReservas(callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {
        const sql= "Select r.fecha_reserva, r.hora_inicio, r.hora_fin,r.id_instalacion, i.nombre from reservas r Join instalaciones i On r.id_instalacion=i.id"
        connection.query(sql, callback);
        connection.release();
      }
    })
  }

  obtenerListaEspera(idInst,fechaRes,horaIni,horaFin, callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {
        const sql= "Select l.id,l.id_reservante, l.id_instalacion, l.fecha_reserva, l.hora_inicio, l.hora_fin, l.asistentes, i.nombre From lista_espera l Join instalaciones i On l.id_instalacion=i.id where l.id_instalacion=? And l.fecha_reserva=? And ((l.hora_inicio>=? And l.hora_inicio <?) Or (l.hora_inicio<? And l.hora_fin>?)) Order By l.fecha_envio_reserva Asc"
        connection.query(sql,[idInst, fechaRes,horaIni,horaFin,horaIni,horaIni ], callback);
        connection.release();
      }
    })
  }

  eliminarReserva(id_reserva, callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {
        const sql= "Delete from reservas Where id=?"
        connection.query(sql, id_reserva, callback);
        connection.release();
      }
    })
  }

  eliminarReservaListaEspera(id, callback){
    this.pool.getConnection((err, connection)=>{
      if (err) {
        callback(err)
      }
      else {
        const sql= "Delete from lista_espera Where id=?"
        connection.query(sql, id, callback);
        connection.release();
      }
    })
  }

  // Función que cierra el pool de conexiones una vez se hyaa terminado de hacer consultas.
  terminarConexion(callback) {
    this.pool.end(callback);
  }
}

module.exports = DAO;
