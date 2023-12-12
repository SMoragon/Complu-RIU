var express = require('express');
var router = express.Router();

const multer = require("multer");
const multerFactory = multer({ storage: multer.memoryStorage() });

const express_validator = require("express-validator");
const body = express_validator.body;

// Password hashing library.
const bcrypt = require("bcrypt");

const hashPassword = async (password) => {
  // Generate a salt
  const salt = await bcrypt.genSalt((saltRounds = 10));
  // Hash password
  return await bcrypt.hash(password, salt);
};

const moment = require("moment");
// Moment language setup.
moment.locale("es");

const pool = require("../pool.js");
const dao = require("../dao.js");


// Dao and pool initialization.
var instPool = pool.get_pool();
var instDao = new dao(instPool);

// Allowed image formats that the user can submit.
const allowedFormats = ["image/jpg", "image/jpeg", "image/png"];

// User's inbox (all messages received, ordered by date from most recent to oldest).
router.get("/inbox", (request, response, next) => {
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
  
  
  // Register webpage load.
  router.get("/register", (request, response, next) => {
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
  router.post(
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
  router.get("/login", (request, response, next) => {
    response.status(200).render("login.ejs");
  });
  
  // Login validation, that ensures everything has the format it should and prevents code injection by escaping all the user has introduced.
  router.post(
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
                request.session.validated = context.validado;
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
  router.get("/logout", (request, response, next) => {
    request.session.isLogged = false;
    request.session.user = undefined;
    request.session.mail = undefined;
    request.session.profile = undefined;
    request.session.defaultProfile = undefined;
    request.session.sinLeer = undefined;
    request.session.is_admin = undefined;
    request.session.validated=undefined;
    response.render("index.ejs");
  });

module.exports=router;