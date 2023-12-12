var express = require('express');
var router = express.Router();

const multer = require("multer");
const multerFactory = multer({ storage: multer.memoryStorage() });

const pool = require("../pool.js");
const dao = require("../dao.js");

// Dao and pool initialization.
var instPool = pool.get_pool();
var instDao = new dao(instPool);

// system configuration page enrouting.
router.get("/config_system", (request, response) => {
    if (request.session.isLogged) {
      if (request.session.is_admin) {
        response.status(200).render("config_system.ejs");
      } else {
        response.status(403).render("no_tienes_permiso.ejs");
      }
    } else {
      response.status(403).render("must_be_login.ejs");
    }
  });
  
  
  // enrouting request to update system configuration.
  router.put(
    "/update_system/:imagen",
    multerFactory.single("org_img"),
    body("org_name").escape(),
    body("org_dir").escape(),
    body("org_ig").escape(),
    body("org_mail").escape(),
    (request, response, next) => {
      if (request.session.isLogged) {
        if (request.session.is_admin) {
          var imagen = request.params.imagen == "true" ? true : false;
          var body = request.body;
          var dato = [
            body["org_name"],
            body["org_dir"],
            body["org_ig"],
            body["org_mail"],
          ];
          if (imagen) {
            dato.push(request.file.buffer);
            dato.push(request.file["mimetype"]);
          }
          instDao.update_config(imagen, dato, (err) => {
            if (err) {
              response.status(400);
            } else {
              request.session.sysConfig["nombre"] = dato[0];
              request.session.sysConfig["direccion"] = dato[1];
              request.session.sysConfig["url_instagram"] = dato[2].replaceAll(
                "&#x2F;",
                "/"
              );
              request.session.sysConfig["correo"] = dato[3];
              if (imagen) {
                request.session.sysConfig["icono"] = dato[4];
                request.session.sysConfig["icono_type"] = dato[5];
              }
              response
                .status(201)
                .json({ msg: "Se ha actualizado correctamente" });
            }
            response.end();
          });
        } else {
          response.status(403).render("no_tienes_permiso.ejs");
        }
      } else {
        response.status(403).render("must_be_login.ejs");
      }
    }
  );

  module.exports=router;