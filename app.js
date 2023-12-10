// App imports.
var express = require("express");
var path = require("path");
const express_validator = require("express-validator");
const body = express_validator.body;
const moment = require("moment");
const pool = require("./pool.js");
const dao = require("./dao.js");
const multer = require("multer");
const querystring = require("querystring");
const multerFactory = multer({ storage: multer.memoryStorage() });
const port = 3000;
const session = require("express-session");
const mysqlsession = require("express-mysql-session");
const { validationResult } = require("express-validator");
const MYSQLStore = mysqlsession(session);
const sessionStore = new MYSQLStore({
  host: "localhost",
  user: "root",
  password: "",
  database: "ucm_riu",
});
const middlewareSession = session({
  saveUninitialized: false,
  secret: "viajesElCorteIngles224",
  resave: false,
  store: sessionStore,
});

// Constant to indicate the main admin (to send validation mails and so on).
const ID_ADMIN = 1;

// Password hashing library.
const bcrypt = require("bcrypt");

const hashPassword = async (password) => {
  // Generate a salt
  const salt = await bcrypt.genSalt((saltRounds = 10));
  // Hash password
  return await bcrypt.hash(password, salt);
};

// Allowed image formats that the user can submit.
const allowedFormats = ["image/jpg", "image/jpeg", "image/png"];

// Moment language setup.
moment.locale("es");

// Dao and pool initialization.
var instPool = new pool("localhost", "root", "", "ucm_riu");
var instDao = new dao(instPool.get_pool());

var app = express();

// View engine setup.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Body parsing options and public directory link, to look for static resources.
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());

// Session setup, stored in the database.
app.use(middlewareSession);

// Middelwares to set params that need to be refreshed every single time a page charges, such as user name, profile picture, 
// system configuration or unread messages; among others.
app.use((request, response, next) => {
  if (request.session.isLogged) {
    if (!request.session.profile) {
      request.session.profile = "/images/default_picture.jpg";
      request.session.defaultProfile = true;
    } else if (request.session.profile !== "/images/default_picture.jpg") {
      request.session.defaultProfile = false;
    }

    instDao.buscarUsuario(request.session.mail, (err, res) => {
      if (err) {
        response.status(400).end();
      } else {
        var id_receptor = res[0].id;
        instDao.obtenerMensajesSinLeer(id_receptor, (err, res) => {
          if (err) {
            response.status(400).end();
          } else {
            request.session.sinLeer = Number(res[0].sinLeer);
            response.locals.session = request.session;
            next();
          }
        });
      }
    });
  } else {
    response.locals.session = request.session;
    next();
  }
});

app.use((request, response, next) => {
  if (typeof request.session.sysConfig === "undefined") {
    instDao.get_config_info((err, res) => {
      if (err) {
        next();
      } else {
        res[0]["url_instagram"] = res[0]["url_instagram"].replaceAll(
          "&#x2F;",
          "/"
        );
        request.session.sysConfig = res[0];
        response.locals.session = request.session;
        next();
      }
    });
  } else {
    response.locals.session = request.session;
    next();
  }
});

// Main app pages enrouting.
app.get("/", (request, response) => {
  instDao.buscarInstalacion("", (err, res) => {
    if (err) {
      response.status(400).end();
    } else {
      response.status(200).render("index.ejs", { instalaciones: res });
    }
  });
});

app.get("/index.html", (request, response) => {
  instDao.buscarInstalacion("", (err, res) => {
    if (err) {
      response.status(400).end();
    } else {
      response.status(200).render("index.ejs", { instalaciones: res });
    }
  });
});

// Middleware to show a "You must log in" message.
app.get("/no_logged", (request, response, next) => {
  response.status(200).render("must_be_login.ejs");
});

// Installation management page enrouting.
app.get("/gestion_instalacion", (request, response) => {
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
app.post(
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
app.put(
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
app.delete("/delete_instalacion/:id", (request, response) => {
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

// validate user page enrouting 
app.get("/validar_registro", (request, response, next) => {
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
app.patch("/validar_registro/:id", (request, response, next) => {
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
app.patch("/hacer_admin/:id", (request, response, next) => {
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
app.delete("/eliminar_registro/:id", (request, response, next) => {
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

// system configuration page enrouting.
app.get("/config_system", (request, response) => {
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

// enrouting request to get list of users with the faculty id giving as params.
app.get("/facultad_usuarios/:id", (request, response) => {
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
app.get("/historial_usuario/:id", (request, response) => {
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
app.get("/historial_instalacion/:id", (request, response) => {
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
app.get("/estadistica_usuario/:id", (request, response) => {
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
app.get("/estadistica_facultad/:id", (request, response) => {
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
app.get("/busquedaAvanzada", (request, response, next) => {
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

// enrouting request to update system configuration.
app.put(
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

// Route to book an installation. If it overlaps with an already booking, throws an erorr to the user indicating that, so that it can decide whether to be
// added to the wait list or not..
app.post("/reservar_instalacion", (request, response, next) => {
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
app.get("/obtener_reservas", (request, response, next) => {
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
app.post("/lista_espera", (request, response, next) => {
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
app.get("/obtener_reservas_inst", (request, response, next) => {
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
app.delete("/eliminar_reserva/:id", (request, response, next) => {
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

// Register webpage load.
app.get("/register", (request, response, next) => {
  if (request.session.isLogged) {
    response.status(400).end();
  } else {
    instDao.obtenerFacultades((err, res) => {
      if (err) {
        response.status(403).render("register.ejs", {
          errors: `No se han podido obtener las facultades`,
          body: request.body,
        });
      } else {
        response.status(200).render("register.ejs", {
          facultades: res,
        });
      }
    });
  }
});

// Register validation, that ensures everything has the format it should and prevents code injection by escaping all the user has introduced.
app.post(
  "/register",
  multerFactory.single("user_profile"),
  body("user_name").escape(),
  body("user_surname").escape(),
  body("user_email")
    .notEmpty()
    .isEmail()
    .escape()
    .withMessage("El email introducido no es válido."),
  body("user_password")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 dígitos")
    .escape(),
  body("user_password_again").escape(),
  body("user_faculty").escape(),
  body("user_course").escape(),
  body("user_group").escape(),
  (request, response, next) => {
    if (request.session.isLogged) {
      response.status(400).end();
    } else {
      instDao.obtenerFacultades((err, res) => {
        if (err) {
          response.status(403).render("register.ejs", {
            errors: `No se han podido obtener las facultades`,
            body: request.body,
          });
        } else {
          facultades = res;

          var result = validationResult(request).array();

          if (result.length != 0) {
            var errs = [];

            result.forEach((element) => {
              errs[element.path] = element.msg;
            });

            response.status(403).render("register.ejs", {
              errors: errs,
              body: request.body,
              facultades: facultades,
            });
          } else {
            instDao.buscarUsuario(
              request.body["user_email"],
              async (err, res) => {
                if (err) {
                  response.status(403).render("register.ejs", {
                    errors:
                      "Ha ocurrido un error interno en el acceso a la BD.",
                    body: request.body,
                    facultades: facultades,
                  });
                } else {
                  if (res.length != 0) {
                    response.status(403).render("register.ejs", {
                      errors: "El correo introducido ya está registrado.",
                      body: request.body,
                      facultades: facultades,
                    });
                  } else {
                    var req = request.body;
                    var mimetype = request.file
                      ? request.file.mimetype
                      : undefined;
                    if (mimetype && !allowedFormats.includes(mimetype)) {
                      response.status(403).render("register.ejs", {
                        errors: `El formato ${mimetype} no está permitido.`,
                        body: request.body,
                        facultades: facultades,
                      });
                    } else {
                      var hashedPassword = await hashPassword(
                        req["user_password"]
                      );
                      var datos = [
                        req["user_name"],
                        req["user_surname"],
                        req["user_email"],
                        hashedPassword,
                        Number(req["user_faculty"]),
                        req["user_course"],
                        req["user_group"],
                        request.file ? request.file.buffer : null,
                        false,
                        false,
                      ];
                      instDao.registrarUsuario(datos, (err, res) => {
                        if (err) {
                          datos[3] = req["user_password"];
                          response.status(403).render("register.ejs", {
                            errors:
                              "Ha ocurrido un error interno en el acceso a la BD.",
                            body: request.body,
                            facultades: facultades,
                          });
                        } else {
                          response.status(200).render("registroCompletado.ejs");
                        }
                      });
                    }
                  }
                }
              }
            );
          }
        }
      });
    }
  }
);

// Login webpage load.
app.get("/login", (request, response, next) => {
  response.status(200).render("login.ejs");
});

// Login validation, that ensures everything has the format it should and prevents code injection by escaping all the user has introduced.
app.post(
  "/login",
  body("user_email")
    .notEmpty()
    .isEmail()
    .escape()
    .withMessage("El email introducido no es válido."),
  body("user_password").escape(),
  (request, response, next) => {
    var result = validationResult(request).array();

    if (result.length != 0) {
      var errs = [];

      result.forEach((element) => {
        errs[element.path] = element.msg;
      });

      response.status(403).render("login.ejs", {
        errors: errs,
        body: request.body,
      });
    } else {
      instDao.buscarUsuario(request.body["user_email"], async (err, res) => {
        if (err) {
          response.status(403).render("login.ejs", {
            errors: "Ha ocurrido un error interno en el acceso a la BD.",
            body: request.body,
          });
        } else {
          if (res.length == 0) {
            response.status(403).render("login.ejs", {
              errors: "El usuario introducido no está registrado.",
              body: request.body,
            });
          } else {
            var context;
            res.map((obj) => {
              context = obj;
            });
            const passwordMatch = await bcrypt.compare(
              request.body["user_password"],
              String(context.contrasenia)
            );
            if (!passwordMatch) {
              response.status(403).render("login.ejs", {
                errors: "La contraseña introducida no es correcta.",
                body: request.body,
              });
            } else {
              if (context.imagen_perfil) {
                request.session.profile = context.imagen_perfil;
                request.session.defaultProfile = false;
              }
              request.session.isLogged = true;
              request.session.user = context.nombre;
              request.session.mail = context.correo;
              request.session.is_admin = context.es_admin;
              request.session.sinLeer = 0;
              response.status(200).redirect("index.html");
            }
          }
        }
      });
    }
  }
);

// Logs the user out, so that it loses all the custom parameters it had before login.
app.get("/logout", (request, response, next) => {
  request.session.isLogged = false;
  request.session.user = undefined;
  request.session.mail = undefined;
  request.session.profile = undefined;
  request.session.defaultProfile = undefined;
  request.session.sinLeer = undefined;
  request.session.is_admin = undefined;
  response.render("index.ejs");
});

// Route not found manage.
app.use(function (req, res, next) {
  res.status(404).send("<h1>ERROR 404 </h1>");
});

// Function to start the server.
app.listen(port, (err) => {
  if (err) {
    console.log("An error ocurred while listening to server");
  } else {
    console.log(`Server listening on port http://localhost:${port} `);
  }
});

module.exports = app;
