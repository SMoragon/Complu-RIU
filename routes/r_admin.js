var express = require('express');
var router = express.Router();

const querystring = require("querystring");
const pool = require("../pool.js");
const dao = require("../dao.js");

// Dao and pool initialization.
var instPool = pool.get_pool();
var instDao = new dao(instPool);

// Constant to indicate the main admin (to send validation mails and so on).
const ID_ADMIN = 1;

// validate user page enrouting 
router.get("/validar_registro", (request, response, next) => {
    if (request.session.isLogged) {
      if (request.session.is_admin) {
        instDao.obtenerUsuariosNoValidatos((err, res) => {
          if (err) {
            response.status(400).end();
          } else {
            response.status(200).render("validarRegistro.ejs", { datos: res });
          }
        });
      } else {
        response.status(403).render("no_tienes_permiso.ejs");
      }
    } else {
      response.status(403).render("must_be_login.ejs");
    }
  });
  
  // enrouting request to validate user with the id giving as params.
  router.patch("/validar_registro/:id", (request, response, next) => {
    if (request.session.isLogged) {
      if (request.session.is_admin) {
        var id = request.params.id;
        id = querystring.escape(id);
        instDao.validarUsuario(id, (err, res) => {
          if (err) {
            response
              .status(400)
              .end("Ha ocurrido un error en el acceso interno de la BD.");
          } else {
            var datos = [
              ID_ADMIN,
              id,
              `¡Bienvenido a ${request.session.sysConfig.nombre}!`,
              "Esperamos que disfrutes de nuestras instalaciones. ¡Diviértete con responsabilidad!",
              false,
              new Date(),
            ];
            instDao.enviarMensaje(datos, (err, res) => {
              if (err) {
                response.status(400).end();
              } else {
                response.status(200).json({ msg: "Usuario validado con exito" });
              }
            });
          }
        });
      } else {
        response.status(403).render("no_tienes_permiso.ejs");
      }
    } else {
      response.status(403).render("must_be_login.ejs");
    }
  });
  
  // enrouting request to convert a user with the id giving as params to admin.
  router.patch("/hacer_admin/:id", (request, response, next) => {
    if (request.session.isLogged) {
      if (request.session.is_admin) {
        var id = request.params.id;
        id = querystring.escape(id);
        instDao.updateToAdminUser(id, (err, res) => {
          if (err) {
            response
              .status(400)
              .end("Ha ocurrido un error en el acceso interno de la BD.");
          } else {
            var datos = [
              ID_ADMIN,
              id,
              `¡Enhorabuena Te has convertido en admin!`,
              "Recuerda que: ¡Un gran poder conlleva una gran responsabilidad!",
              false,
              new Date(),
            ];
            instDao.enviarMensaje(datos, (err, res) => {
              if (err) {
                response.status(402).end();
              } else {
                response
                  .status(200)
                  .json({ msg: "Usuario convertido en admin." });
              }
            });
          }
        });
      } else {
        response.status(403).render("no_tienes_permiso.ejs");
      }
    } else {
      response.status(403).render("must_be_login.ejs");
    }
  });
  
  // enrouting request to delete user with the id giving as params.
  router.delete("/eliminar_registro/:id", (request, response, next) => {
    if (request.session.isLogged) {
      if (request.session.is_admin) {
        var id = request.params.id;
        id = querystring.escape(id);
        instDao.eliminarUsuario(id, (err, res) => {
          if (err) {
            response.status(400).end();
          } else {
            response.status(200).json({ msg: "Usuario eliminado con exito" });
          }
        });
      } else {
        response.status(403).render("no_tienes_permiso.ejs");
      }
    } else {
      response.status(403).render("must_be_login.ejs");
    }
  });

module.exports = router;