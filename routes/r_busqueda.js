var express = require('express');
var router = express.Router();

const querystring = require("querystring");
const pool = require("../pool.js");
const dao = require("../dao.js");

// Dao and pool initialization.
var instPool = pool.get_pool();
var instDao = new dao(instPool.get_pool());

// enrouting request to get list of users with the faculty id giving as params.
router.get("/facultad_usuarios/:id", (request, response) => {
    if (request.session.isLogged) {
      if (request.session.is_admin) {
        var id = request.params.id;
        id = querystring.escape(id);
        instDao.obtenerFacultadesListaUsuario(id, (err, result) => {
          if (err) {
            response.status(404).end();
          } else {
            response.status(200).json({ usuarios: result });
          }
        });
      } else {
        response.status(403).render("no_tienes_permiso.ejs");
      }
    } else {
      response.status(403).render("must_be_login.ejs");
    }
  });
  
  // enrouting request to get a list of user history with user id as parameters.
  router.get("/historial_usuario/:id", (request, response) => {
    if (request.session.isLogged) {
      if (request.session.is_admin) {
        var id = request.params.id;
        id = querystring.escape(id);
        instDao.obtenerHistorialUsuario(id, (err, result) => {
          if (err) {
            response.status(404).end();
          } else {
            response.status(200).json({ historial: result });
          }
        });
      } else {
        response.status(403).render("no_tienes_permiso.ejs");
      }
    } else {
      response.status(403).render("must_be_login.ejs");
    }
  });
  
  // enrouting request to get a list of reservation history by providing a facility id as parameters.
  router.get("/historial_instalacion/:id", (request, response) => {
    if (request.session.isLogged) {
      if (request.session.is_admin) {
        var id = request.params.id;
        id = querystring.escape(id);
        instDao.obtenerHistorialInstalacion(id, (err, result) => {
          if (err) {
            response.status(404).end();
          } else {
            response.status(200).json({ historial: result });
          }
        });
      } else {
        response.status(403).render("no_tienes_permiso.ejs");
      }
    } else {
      response.status(403).render("must_be_login.ejs");
    }
  });
  
  // enrouting request to get user statistics providing user id as parameters.
  router.get("/estadistica_usuario/:id", (request, response) => {
    if (request.session.isLogged) {
      if (request.session.is_admin) {
        var id = request.params.id;
        id = querystring.escape(id);
        instDao.obtenerEstadisticaUsuario(id, (err, result) => {
          if (err) {
            response.status(404).end();
          } else {
            response.status(200).json({ estadistica: result });
          }
        });
      } else {
        response.status(403).render("no_tienes_permiso.ejs");
      }
    } else {
      response.status(403).render("must_be_login.ejs");
    }
  });
  
  // enrouting request to get faculty statistics providing faculty id as parameters.
  router.get("/estadistica_facultad/:id", (request, response) => {
    if (request.session.isLogged) {
      if (request.session.is_admin) {
        var id = request.params.id;
        id = querystring.escape(id);
        instDao.obtenerEstadisticaFacultad(id, (err, result) => {
          if (err) {
            response.status(404).end();
          } else {
            response.status(200).json({ estadistica: result });
          }
        });
      } else {
        response.status(403).render("no_tienes_permiso.ejs");
      }
    } else {
      response.status(403).render("must_be_login.ejs");
    }
  });
  
  // advanced search page enrouting.
  router.get("/busquedaAvanzada", (request, response, next) => {
    if (request.session.isLogged) {
      if (request.session.is_admin) {
        // get search querys
        var tipo_busqueda = request.query["tipo_busqueda"];
        var filtrar_por = request.query["filtrar_por"];
        var search = request.query["search"];
        var date_init = request.query["date_init"];
        var date_end = request.query["date_end"];
        if (search !== undefined) {
          search = querystring.escape(search);
          search = search.replaceAll("%40", "@");
          search = search.replaceAll("%20", " ");
        }
        //callback for each search type.
        var usuario_callback = (err, res_usuario) => {
          if (err) {
            next();
          } else {
            response
              .status(200)
              .render("busquedaAvanzada.ejs", { usuarios: res_usuario });
          }
        };
        var reservas_callback = (err, res_reservas) => {
          if (err) {
            next();
          } else {
            response
              .status(200)
              .render("busquedaAvanzada.ejs", { reservas: res_reservas });
          }
        };
        var facultad_callback = (err, res_facultad) => {
          if (err) {
            next();
          } else {
            response
              .status(200)
              .render("busquedaAvanzada.ejs", { facultades: res_facultad });
          }
        };
        var instalacion_callback = (err, res_instalacion) => {
          if (err) {
            next();
          } else {
            response
              .status(200)
              .render("busquedaAvanzada.ejs", { instalaciones: res_instalacion });
          }
        };
        //case of search
        switch (tipo_busqueda) {
          case "Usuario":
            switch (filtrar_por) {
              case "Nombre":
                instDao.obtenerListaUsuarioPorNombre(search, usuario_callback);
                break;
              case "Apellido":
                instDao.obtenerListaUsuarioPorApellido(search, usuario_callback);
                break;
              case "Correo":
                instDao.obtenerListaUsuarioPorCorreo(search, usuario_callback);
                break;
              case "Facultad":
                instDao.obtenerListaUsuarioPorFaculdad(search, usuario_callback);
                break;
            }
            break;
          case "Reserva":
            switch (filtrar_por) {
              case "Nombre Usuario":
                instDao.obtenerReservaPorNombreUsuario(search, reservas_callback);
                break;
              case "Apellido Usuario":
                instDao.obtenerReservaPorApellidoUsuario(
                  search,
                  reservas_callback
                );
                break;
              case "Nombre Facultad":
                instDao.obtenerReservaPorNombreFacultad(
                  search,
                  reservas_callback
                );
                break;
              case "Nombre Instalacion":
                instDao.obtenerReservaPorNombreInstalacion(
                  search,
                  reservas_callback
                );
                break;
              case "Fecha Inicio - Fecha Fin":
                instDao.obtenerReservaPorRangoTemporal(
                  [date_init, date_end],
                  reservas_callback
                );
                break;
            }
            break;
          case "Facultad":
            switch (filtrar_por) {
              case "Nombre Facultad":
                instDao.obtenerFacultadesPorNombre(search, facultad_callback);
                break;
              case "Nombre Usuario":
                instDao.obtenerFacultadesPorUsuarioNombre(
                  search,
                  facultad_callback
                );
                break;
              case "Apellido Usuario":
                instDao.obtenerFacultadesPorUsuarioApellido(
                  search,
                  facultad_callback
                );
                break;
            }
            break;
          case "Instalacion":
            instDao.obtenerInstalacionPorNombre(search, instalacion_callback);
            break;
          default:
            response.status(200).render("busquedaAvanzada.ejs");
        }
      } else {
        response.status(403).render("no_tienes_permiso.ejs");
      }
    } else {
      response.status(403).render("must_be_login.ejs");
    }
  });
  
  module.exports = router;