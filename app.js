var express = require("express");
var path = require("path");
const express_validator = require("express-validator");
const body = express_validator.body;

const pool = require("./pool.js");
const dao = require("./dao.js");
const multer = require("multer");
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

const bcrypt = require("bcrypt");

const hashPassword = async (password) => {
  // Generate a salt
  const salt = await bcrypt.genSalt((saltRounds = 10));
  // Hash password
  return await bcrypt.hash(password, salt);
};

const allowedFormats = ["image/jpg", "image/jpeg", "image/png"];

var instPool = new pool("localhost", "root", "", "ucm_riu");
var instDao = new dao(instPool.get_pool());

var app = express();

// view engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(middlewareSession);

app.use((req, res, next) => {
  if (req.session.isLogged) {
    if (!req.session.profile) {
      req.session.profile = "/images/default_picture.jpg";
      req.session.defaultProfile = true;
    } else if (req.session.profile !== "/images/default_picture.jpg") {
      req.session.defaultProfile = false;
    }
  }
  res.locals.session = req.session;
  next();
});

// Enrutamiento de las páginas principales de nuestra aplicación.
app.get("/", (request, response) => {
  response.status(200).render("index.ejs");
});

app.get("/index.html", (request, response) => {
  response.status(200).render("index.ejs");
});

app.get("/gestion_instalacion.ejs", (request, response) => {
  var iter = [1, 2, 3, 4, 5, 6, 7, 8];
  response.status(200).render("gestion_instalaciones.ejs", { dato: iter });
});
// catch 404 and forward to error handler

app.get("/register", (request, response, next) => {
  response.status(200).render("register.ejs");
});

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
    var result = validationResult(request).array();

    if (result.length != 0) {
      var errs = [];

      result.forEach((element) => {
        errs[element.path] = element.msg;
      });

      response.status(403).render("register.ejs", {
        errors: errs,
        body: request.body,
      });
    } else {
      instDao.buscarUsuario(request.body["user_email"], async (err, res) => {
        if (err) {
          response.status(403).render("register.ejs", {
            errors: "Ha ocurrido un error interno en el acceso a la BD.",
            body: request.body,
          });
        } else {
          if (res.length != 0) {
            response.status(403).render("register.ejs", {
              errors: "El correo introducido ya está registrado.",
              body: request.body,
            });
          } else {
            var req = request.body;
            var mimetype = request.file ? request.file.mimetype : undefined;
            if (mimetype && !allowedFormats.includes(mimetype)) {
              response.status(403).render("register.ejs", {
                errors: `El formato ${mimetype} no está permitido.`,
                body: request.body,
              });
            } else {
              req["user_password"];
              req["user_password"] = await hashPassword(req["user_password"]);
              var datos = [
                req["user_name"],
                req["user_surname"],
                req["user_email"],
                req["user_password"],
                req["user_faculty"],
                req["user_course"],
                req["user_group"],
                request.file ? request.file.buffer : null,
                false,
              ];
              instDao.registrarUsuario(datos, (err, res) => {
                if (err) {
                  response.status(403).render("register.ejs", {
                    errors:
                      "Ha ocurrido un error interno en el acceso a la BD.",
                    body: request.body,
                  });
                } else {
                  response.status(200).render("registroCompletado.ejs");
                }
              });
            }
          }
        }
      });
    }
  }
);

app.get("/login", (request, response, next) => {
  response.status(200).render("login.ejs");
});

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
              response.status(200).redirect("index.html"); // The error occurs after here (with try-catch, it does not detect anything, but i dont know where it is)
            }
          }
        }
      });
    }
  }
);

app.get("/logout", (request, response, next) => {
  request.session.isLogged = false;
  request.session.user = undefined;
  request.session.profile = undefined;
  request.session.defaultProfile = undefined;
  response.render("index.ejs");
});

app.use(function (req, res, next) {
  res.status(404).send("<h1>ERROR 404 </h1>");
});

// Función para iniciar el servidor, que espera las peticiones del usuario.
app.listen(port, (err) => {
  if (err) {
    console.log("An error ocurred while listening to server");
  } else {
    console.log(`Server listening on port http://localhost:${port} `);
  }
});

module.exports = app;
