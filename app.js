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

app.get("/gestion_instalacion.ejs", (request, response) => {
  var iter=[1,2,3,4,5,6,7,8]
  response.status(200).render("gestion_instalaciones.ejs",{dato:iter});
});
// catch 404 and forward to error handler
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
