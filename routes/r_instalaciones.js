var express = require('express');
var router = express.Router();

// Installation management page enrouting.
router.get("/gestion_instalacion", (request, response) => {
  if (request.session.isLogged) {
    if (request.session.is_admin) {
      var busqueda = "";
      if (request.query["search"] !== undefined) {
        busqueda = request.query["search"];
      }
      instDao.buscarInstalacion(busqueda, (err, res) => {
        if (err) {
          response.status(400).end();
        } else {
          res.map((element) => {
            var [horas, mins, segs] = element.horario_apertura.split(":");
            element.horario_apertura = horas + ":" + mins;

            var [horas, mins, segs] = element.horario_cierre.split(":");
            element.horario_cierre = horas + ":" + mins;
          });
          response
            .status(200)
            .render("gestion_instalaciones.ejs", { dato: res });
        }
      });
    } else {
      response.status(403).render("no_tienes_permiso.ejs");
    }
  } else {
    response.status(403).render("must_be_login.ejs");
  }
});

// enrouting request to add new instalacion 
router.post(
  "/add_instalacion",
  multerFactory.single("instalacion_imagen"),
  body("instalacion_nombre").escape(),
  (request, response) => {
    if (request.session.isLogged) {
      if (request.session.is_admin) {
        var body = request.body;
        var datos = [
          body["instalacion_nombre"],
          body["horario_apertura"],
          body["horario_cierre"],
          body["tipo_reserva"],
          body["aforo"],
          request.file ? request.file.buffer : null,
          request.file["mimetype"],
        ];
        instDao.insertar_instalacion(datos, (err) => {
          if (err) {
            response.status(400);
          } else {
            response.status(201).json({
              msg: "Instalación añadida con éxito, para que haga efecto, refresca la página",
            });
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

// enrouting request to modify an existing installation
router.put(
  "/modificar_instalacion/:imagen",
  multerFactory.single("instalacion_imagen"),
  body("m_instalacion_nombre").escape(),
  (request, response) => {
    if (request.session.isLogged) {
      if (request.session.is_admin) {
        var imagen = request.params.imagen == "true" ? true : false;
        var body = request.body;
        var id = body["instalacion_id"];
        var dato = [
          body["m_instalacion_nombre"],
          body["m_horario_apertura"],
          body["m_horario_cierre"],
          body["m_tipo_reserva"],
          body["m_aforo"],
        ];
        if (imagen) {
          dato.push(request.file.buffer);
          dato.push(request.file["mimetype"]);
        }
        instDao.modificarInstalacion(id, imagen, dato, (err) => {
          if (err) {
            response.status(400);
          } else {
            response.status(201).json({
              msg: "Instalacion modificado con exito, para que se haga efecto, reflesca la pagina",
            });
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

// enrouting request to delete an existing installation
router.delete("/delete_instalacion/:id", (request, response) => {
  if (request.session.isLogged) {
    if (request.session.is_admin) {
      var id = request.params.id;
      id = querystring.escape(id);
      instDao.eliminarInstalacion(id, (err) => {
        if (err) {
          response.status(404).json({ msg: "Instalacion no existente" });
        } else {
          response.status(201).json({ msg: "Instalacion eliminado con exito" });
        }
        response.end();
      });
    } else {
      response.status(403).render("no_tienes_permiso.ejs");
    }
  } else {
    response.status(403).render("must_be_login.ejs");
  }
});


module.exports = router;
