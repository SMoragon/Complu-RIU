// App imports.
var express = require("express");
var path = require("path");
const pool = require("./pool.js");
const dao = require("./dao.js");
const port = 3000;
const session = require("express-session");
const mysqlsession = require("express-mysql-session");
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

// Dao and pool initialization.
var instPool = new pool("localhost", "root", "", "ucm_riu");
var instDao = new dao(pool.get_pool());

// Routers import
const inst_router = require("./routes/r_instalaciones.js");
const admin_router = require("./routes/r_admin.js");
const busqueda_router = require("./routes/r_busqueda.js");
const system_router = require("./routes/r_system.js");
const correo_router = require("./routes/r_correo.js");
const reservas_router = require("./routes/r_reservas.js");
const usuario_router = require("./routes/r_usuario.js");

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

// Middleware to show a "You are not validated" message.
app.get("/no_validated", (request, response, next) => {
  response.status(200).render("must_be_validated.ejs");
});

// Installation management enrouting.
app.use("/instalaciones", inst_router);

// Admin users management enrouting.
app.use("/admin", admin_router);

// Admin's advanced search management enrouting.
app.use("/busqueda", busqueda_router);

// Admin's advanced search management enrouting.
app.use("/system", system_router);

// Inbox and messages management enrouting.
app.use("/correo", correo_router);

// Bookings, wait list and interactive calendar enrouting.
app.use("/reservas", reservas_router);

// User resgister, login and own inbox enrouting.
app.use("/usuario", usuario_router);

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
