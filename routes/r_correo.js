var express = require('express');
var router = express.Router();

// User's inbox (all messages received, ordered by date from most recent to oldest).
app.get("/inbox", (request, response, next) => {
    if (!request.session.isLogged) {
      response.status(400).end();
    } else {
      instDao.buscarUsuario(request.session.mail, (err, res) => {
        if (err) {
          response.status(400).end();
        } else {
          var id_receptor = res[0].id;
          instDao.obtenerMensajes(id_receptor, (err, res) => {
            if (err) {
              response.status(400).end();
            } else {
              res.forEach((mensaje) => {
                mensaje.fecha_envio = moment(mensaje.fecha_envio).fromNow();
              });
              response.status(200).render("inbox.ejs", { datos: res });
            }
          });
        }
      });
    }
  });
  
  // User's messages filtered by a text given by the user.
  app.get("/get_filtered_mail", (request, response, next) => {
    if (!request.session.isLogged) {
      response.status(400).end();
    } else {
      instDao.buscarUsuario(request.session.mail, (err, res) => {
        if (err) {
          response.status(400).end();
        } else {
          var id_receptor = res[0].id;
  
          if (String(request.query["filter_by"]).trimStart().trimEnd() === "") {
            instDao.obtenerMensajes(id_receptor, (err, res) => {
              if (err) {
                response.status(400).end();
              } else {
                res.forEach((mensaje) => {
                  mensaje.fecha_envio = moment(mensaje.fecha_envio).fromNow();
                });
                response.status(200).render("inbox.ejs", { datos: res });
              }
            });
          } else {
            instDao.obtenerMensajesFiltrados(
              id_receptor,
              request.query["filter_by"],
              (err, res) => {
                if (err) {
                  response.status(400).end();
                } else {
                  res.forEach((mensaje) => {
                    mensaje.fecha_envio = moment(mensaje.fecha_envio).fromNow();
                  });
                  response.status(200).render("inbox.ejs", { datos: res });
                }
              }
            );
          }
        }
      });
    }
  });
  
  
  
  // Route to mark a message as read (set the boolean to "True").
  app.patch("/marcar_leido/:id", (request, response, next) => {
    if (!request.session.isLogged) {
      response.status(400).end();
    } else {
      instDao.marcarComoLeido(request.params.id, (err, res) => {
        if (err) {
          response
            .status(400)
            .end("Ha ocurrido un error en el acceso interno de la BD.");
        } else {
          response.status(200).end();
        }
      });
    }
  });
  
  // Route to send a message from a user to another one. It also ensures implied users belong to the same faculty, or at least one of them is admin.
  app.post(
    "/write_mail",
    body("mail").escape(),
    body("receptor").escape(),
    body("asunto").escape(),
    (request, response, next) => {
      if (!request.session.isLogged) {
        response.status(400).end();
      } else {
        instDao.buscarUsuario(request.session.mail, async (err, res) => {
          if (err) {
            response.status(400).end();
          } else {
            var idEmisor = res[0].id;
            var emisor = res[0];
            instDao.buscarUsuario(request.body.receptor, (err, res) => {
              if (err) {
                response.status(400).end();
              } else {
                // Remitent does not exist.
                if (res.length == 0) {
                  response.status(400).end("No receiver found");
                } else {
                  if (
                    res[0].facultad != emisor.facultad &&
                    !emisor.es_admin &&
                    !res[0].es_admin
                  )
                  // Different faculty.
                  {
                    response.status(400).end("Faculty does not match");
                  } else {
                    var idReceptor = res[0].id;
  
                    datos = [
                      idEmisor,
                      idReceptor,
                      request.body.asunto,
                      request.body.mensaje,
                      false,
                      new Date(),
                    ];
                    instDao.enviarMensaje(datos, (err, res) => {
                      if (err) {
                        response.status(400).end();
                      } else {
                        response.status(201).end();
                      }
                    });
                  }
                }
              }
            });
          }
        });
      }
    }
  );
  

module.exports=router;