var express = require('express');
var path = require('path');

const port = 3000;

//var indexRouter = require('./routes/index');
//var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', indexRouter);
//app.use('/users', usersRouter);
// Enrutamiento de las páginas principales de nuestra aplicación.
app.get("/", (request, response) => {
  response.status(200).render("index.ejs");
});

app.get("/index.html", (request, response) => {
  response.status(200).render("index.ejs");
});
// catch 404 and forward to error handler

app.get("/register", (request, response, next) => {
  response.status(200).render("register.ejs");
});

app.post("/register", (request, response, next) => {
  destDao.buscarUsuario(request.body["user-email"], (err, res) => {
    if (err) {
      response.status(403).render("register.ejs", {
        errors: "Ha ocurrido un error interno en el acceso a la BD.",
      });
    } else {
      if (res.length != 0) {
        response.status(403).render("register.ejs", {
          errors: "El correo introducido ya está registrado.",
        });
      } else {
        var datos = [request.body["user-email"], request.body["user-password"]];
        destDao.registrarUsuario(datos, (err, res) => {
          if (err) {
            response.status(403).render("register.ejs", {
              errors: "Ha ocurrido un error interno en el acceso a la BD.",
            });
          } else {
            response.status(200).render("registroCompletado.ejs");
          }
        });
      }
    }
  });
});

app.get("/login", (request, response, next) => {
  response.status(200).render("login.ejs");
});

app.post("/login", (request, response, next) => {
  destDao.buscarUsuario(request.body["user-email"], (err, res) => {
    if (err) {
      response.status(403).render("login.ejs", {
        errors: "Ha ocurrido un error interno en el acceso a la BD.",
      });
    } else {
      if (res.length == 0) {
        response.status(403).render("login.ejs", {
          errors: "El usuario introducido no está registrado.",
        });
      } else {
        var context;
        res.map((obj) => {
          context = obj;
        });

        if (request.body["user-password"] != context.contraseña) {
          response.status(403).render("login.ejs", {
            errors: "La contraseña introducida no es correcta.",
          });
        } else {
          request.session.isLogged = true;
          request.session.user = request.body["user-email"];
          response.status(200).redirect("index.html"); // De momento index, ya cogeremos la ruta en la que estaba
        }
      }
    }
  });
});

app.use(function(req, res, next) {
  res.status(404).send("<h1>ERROR 404 </h1>")
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
