var express = require('express');
var router = express.Router();

const pool = require("../pool.js");
const dao = require("../dao.js");

// Dao and pool initialization.
var instPool = pool.get_pool();
var instDao = new dao(instPool);

// Constant to indicate the main admin (to send validation mails and so on).
const ID_ADMIN = 1;

// Route to book an installation. If it overlaps with an already booking, throws an erorr to the user indicating that, so that it can decide whether to be
// added to the wait list or not..
router.post("/reservar_instalacion", (request, response, next) => {
    if (!request.session.isLogged) {
      response.status(405).end("No logged");
    } else {
      instDao.buscarUsuario(request.session.mail, (err, res) => {
        if (err) {
          response.status(400).end();
        } else {
          var user_id = res[0].id,
            inst_id = Number(request.body["inst_id"]),
            inst_date = request.body["book_inst_date"],
            inst_from = request.body["book_inst_from"],
            inst_to = request.body["book_inst_to"],
            how_many = request.body["book_inst_how_many"];
  
          instDao.obtenerReservasSolape(
            inst_id,
            inst_date,
            inst_from,
            inst_to,
            (err, res) => {
              if (err) {
                response.status(400).end();
              } else {
                if (res[0].solapes != 0) {
                  response.status(400).end("Solape");
                } else {
                  var datos = [
                    user_id,
                    inst_id,
                    inst_date,
                    inst_from,
                    inst_to,
                    how_many,
                  ];
                  instDao.reservarInstalacion(datos, (err, res) => {
                    if (err) {
                      response.status(400).end();
                    } else {
                      response.status(201).end();
                    }
                  });
                }
              }
            }
          );
        }
      });
    }
  });
  
  // Request made to get all the bookings of a certain user, so that a list of them can be built.
  router.get("/obtener_reservas", (request, response, next) => {
    if (!request.session.isLogged) {
      response.status(405).end("No logged");
    } else {
      instDao.buscarUsuario(request.session.mail, (err, res) => {
        if (err) {
          response
            .status(400)
            .end("Se ha producido un error interno en el acceso a la BD.");
        } else {
          var id_reservante = res[0].id;
          instDao.obtenerReservasUsuario(id_reservante, async (err, res) => {
            if (err) {
              response
                .status(400)
                .end("Se ha producido un error interno en el acceso a la BD.");
            } else {
              res.map((elem) => {
                elem.imagen = elem.imagen.toString("base64");
                elem.fecha_reserva = elem.fecha_reserva.toLocaleDateString();
              });
              response.status(200).json({ reservas: res });
            }
          });
        }
      });
    }
  });
  
  // Route to add a booking request to the wait list.
  router.post("/lista_espera", (request, response, next) => {
    if (!request.session.isLogged) {
      response.status(400).end();
    } else {
      instDao.buscarUsuario(request.session.mail, (err, res) => {
        if (err) {
          response.status(400).end();
        } else {
          var inst_id = Number(request.body["inst_id"]),
            inst_date = request.body["book_inst_date"],
            inst_from = request.body["book_inst_from"],
            inst_to = request.body["book_inst_to"],
            how_many = request.body["book_inst_how_many"];
          var datos = [
            res[0].id,
            inst_id,
            inst_date,
            inst_from,
            inst_to,
            new Date(),
            how_many,
          ];
          instDao.reservarListaEspera(datos, (err, res) => {
            if (err) {
              response.status(400).end();
            } else {
              response.status(201).end();
            }
          });
        }
      });
    }
  });
  
  // Route to get all bookings made, and also the installations information, so that a dynamic interactive calendar can be displayed.
  router.get("/obtener_reservas_inst", (request, response, next) => {
    if (!request.session.isLogged) {
      response.status(405).end("No logged");
    } else {
      instDao.obtenerReservas((err, res) => {
        if (err) {
          response
            .status(400)
            .end("Se ha producido un error interno en el acceso a la BD.");
        } else {
          res.forEach((r) => {
            var date = new Date(r.fecha_reserva);
            r.fecha_reserva =
              date.getFullYear() +
              "-" +
              (date.getMonth() + 1) +
              "-" +
              date.getDate();
          });
          var reservas = res;
  
          instDao.obtenerInstalacionPorNombre("", (err, res) => {
            if (err) {
              response.status(400).end();
            } else {
              response
                .status(200)
                .json({ reservas: reservas, instalaciones: res });
            }
          });
        }
      });
    }
  });
  
  // Route to manage a booking deletion.
  router.delete("/eliminar_reserva/:id", (request, response, next) => {
    var id_res = request.params.id;
    // First, it gets the booking itself, given the id.
    instDao.obtenerReservasId(id_res, (err, res) => {
      if (err) {
        response.status(400).end();
      } else {
        var reserva = res[0];
        // Then, it deletes it from the wait list.
        instDao.eliminarReserva(id_res, (err, res) => {
          if (err) {
            response.status(400).end();
          } else {
            // Also, the wait list is got and stored for future purposes.
            instDao.obtenerListaEspera(
              reserva.id_instalacion,
              reserva.fecha_reserva,
              reserva.hora_inicio,
              reserva.hora_fin,
              (err, res) => {
                if (err) {
                  response.status(400).end();
                } else {
                  var res_lista = res;
                  if (res_lista.length > 0) {
                    // After that, the effective bookings made are got.
                    instDao.obtenerReservasInstalacion(
                      reserva.id_instalacion,
                      reserva.fecha_reserva,
                      // The aim of this is to check if there is any waiting booking that does not overlap with already made bookings, so that the time the
                      // deleted booking was catching can be given to another user(s).
                      async (err, res) => {
                        if (err) {
                          response.status(400).end();
                        } else {
                          var reservas = await res;
                          var candidatos = [];
  
                          for (var i = 0; i < res_lista.length; i++) {
                            var actI = res_lista[i];
                            var no_solapes = true;
  
                            for (
                              var j = 0;
                              j < reservas.length && no_solapes;
                              j++
                            ) {
                              var actJ = reservas[j];
                              if (
                                (actJ.hora_inicio >= actI.hora_inicio &&
                                  actJ.hora_inicio < actI.hora_fin) ||
                                (actJ.hora_inicio < actI.hora_inicio &&
                                  actJ.hora_fin > actI.hora_inicio)
                              ) {
                                no_solapes = false;
                              }
                            }
  
                            if (no_solapes) {
                              candidatos.push(actI);
                            }
                          }
                          // If there is any candidate that could take advantage of that time, another checks has to be done.
                          // That is getting (by order of booking date) the maximum amount of possible users outof the wait list,
                          // only if they do not overlap between them nor with the effective bookings made.
                          if (candidatos.length > 0) {
                            var cand_aux = [];
                            cand_aux.push(candidatos[0]);
  
                            for (var i = 1; i < candidatos.length; i++) {
                              var candI = candidatos[i],
                                no_solape = true;
                              for (
                                var j = 0;
                                j < cand_aux.length && no_solape;
                                j++
                              ) {
                                var candJ = candidatos[j];
                                if (candI === candJ) {
                                  no_solapes = false;
                                  break;
                                }
  
                                if (
                                  (candI.hora_inicio >= candJ.hora_inicio &&
                                    candI.hora_inicio < candJ.hora_fin) ||
                                  (candI.hora_inicio < candJ.hora_inicio &&
                                    candI.hora_fin > candJ.hora_inicio)
                                ) {
                                  no_solape = false;
                                }
                              }
                              if (no_solape) {
                                cand_aux.push(candI);
                              }
                            }
  
                            candidatos = cand_aux;
  
                            // To ensure the check before mentioned, each candidate has to be checked, so an asynchronous control is vital to that.
                            async function processCandidates() {
                              try {
                                for (const candidato of candidatos) {
                                  try {
                                    // AFor every fittin candidate...
                                    await new Promise((resolve, reject) => {
                                      // The candidate is deleted from the wait list.
                                      instDao.eliminarReservaListaEspera(
                                        candidato.id,
                                        async (err, res) => {
                                          await res;
                                          if (err) {
                                            reject(err);
                                          } else {
                                            var datos = [
                                              candidato.id_reservante,
                                              candidato.id_instalacion,
                                              candidato.fecha_reserva,
                                              candidato.hora_inicio,
                                              candidato.hora_fin,
                                              candidato.asistentes,
                                            ];
                                            // Then, the candidate is added to the effective bookings list.
                                            instDao.reservarInstalacion(
                                              datos,
                                              async (err, res) => {
                                                await res;
                                                if (err) {
                                                  reject(err);
                                                } else {
                                                  var [horas, mins, segs] =
                                                    candidato.hora_inicio.split(
                                                      ":"
                                                    );
                                                  candidato.hora_inicio =
                                                    horas + ":" + mins;
  
                                                  var [horas, mins, segs] =
                                                    candidato.hora_fin.split(":");
                                                  candidato.hora_fin =
                                                    horas + ":" + mins;
  
                                                  candidato.fecha_reserva =
                                                    new Date(
                                                      candidato.fecha_reserva
                                                    ).toLocaleDateString();
  
                                                  var datos = [
                                                    ID_ADMIN,
                                                    candidato.id_reservante,
                                                    `Reserva en la instalación "${candidato.nombre}" el ${candidato.fecha_reserva} de ${candidato.hora_inicio} a ${candidato.hora_fin} `,
                                                    `Alguien ha cancelado su reserva, así que ahora es tuya. ¡Genial! Si deseas cancelarla, ve a la pestaña "Mis reservas" y haz click en "Cancelar reserva".`,
                                                    false,
                                                    new Date(),
                                                  ];
                                                  // Finally, the user is sent a message (by the main admin) to confirm the booking is now him/her's, so 
                                                  // that he/she knows is out of the waiting list.
                                                  instDao.enviarMensaje(
                                                    datos,
                                                    async (err, res) => {
                                                      await res;
                                                      if (err) {
                                                        reject(err);
                                                      } else {
                                                        resolve();
                                                      }
                                                    }
                                                  );
                                                }
                                              }
                                            );
                                          }
                                        }
                                      );
                                    });
                                  } catch (error) {
                                    throw error;
                                  }
                                }
                                response.status(200).end();
                              } catch (error) {
                                response.status(400).end(error);
                                return;
                              }
                            }
                            await processCandidates();
                          } else {
                            response.status(200).end();
                          }
                        }
                      }
                    );
                  } else {
                    response.status(200).end();
                  }
                }
              }
            );
          }
        });
      }
    });
  });
  

module.exports=router;