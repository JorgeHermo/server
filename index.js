const express = require("express");
const app = express();
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const puerto = process.env.PORT || 3001;
const secreto = "secreto";
const crypto = require("crypto");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongodb = require("mongodb");
let MongoClient = mongodb.MongoClient;
const MongoStore = require("connect-mongo");

let feedback = {
  provider: true,
  mensaje: ""
};

let tienda = require("./tienda");
let bandas = require("./bandas");
let noticias = require("./noticias");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000", //dirección de la app de React desde la que nos llegarán las peticiones.
    credentials: true,
  })
);
app.use(
  session({
    secret: secreto, //Secreto de la sesion (se puede hacer dinámico),
    resave: false, //Evita el reseteo de la sesión con cada llamada
    saveUninitialized: false, //Evita crear sesiones vacías
    store: MongoStore.create({
      //Nos guarda las sesiones en la colección "sesiones" en la base de datos
      mongoUrl:
        "mongodb+srv://user:wesewese12@cluster0.quueo.mongodb.net/proyectofinal?retryWrites=true&w=majority",
      dbName: "proyectofinal",
      collectionName: "sesiones",
      ttl: 1000 * 60 * 60 * 24, //Time To Live de las sesiones
      autoRemove: "native", //Utiliza el registro TTL de Mongo para ir borrando las sesiones caducadas.
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, //Caducidad de la cookie en el navegador del cliente.
    },
  })
);
app.use(cookieParser(secreto)); //Mismo que el secreto de la sesión
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  //Middleware para publicar en consola la sesión y el usuario. Activar en desarrollo.
  console.log(req.session ? req.session : "No hay sesión");
  console.log(req.user ? req.user : "No hay usuario");
  next();
});

MongoClient.connect(
  "mongodb+srv://user:wesewese12@cluster0.quueo.mongodb.net/proyectofinal?retryWrites=true&w=majority",
  { useUnifiedTopology: true },
  function (error, client) {
    error
      ? (console.log("mongo no conectado"), console.log(error))
      : ((app.locals.db = client.db("proyectofinal")),
        console.log("mongo conectado"));
  }
);

app.use("/bandas", bandas);
app.use("/tienda", tienda);
app.use("/noticias", noticias);

//---------------Gestion de sesiones--------

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    function (email, password, done) {
      feedback.mensaje = "";
      app.locals.db
        .collection("users")
        .findOne({ email: email }, function (err, user) {
          if (err) {
            return done(err);
          }
          if (!user) {
            feedback.provider
              ? (feedback.mensaje = "Usuario no registrado")
              : (feedback.mensaje = "Login incorrecto");
            return done(null, false);
          }
          if (!validoPass(password, user.password.hash, user.password.salt)) {
            feedback.provider
              ? (feedback.mensaje = "Usuario no registrado")
              : (feedback.mensaje = "Login incorrecto");
            return done(null, false);
          }
          return done(null, user);
        });
    }
  )
);

passport.serializeUser(function (user, done) {
  console.log("-> Serialize");
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  console.log("-> Deserialize");
  app.locals.db
    .collection("users")
    .findOne({ email: user.email }, function (err, usuario) {
      if (err) {
        return done(err);
      }
      if (!usuario) {
        return done(null, null);
      }
      return done(null, usuario);
    });
});

//login

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/api",
    failureRedirect: "/api/fail",
  })
);

app.all("/api", function (req, res) {
  // Utilizar .all como verbo => Las redirecciones desde un cliente Rest las ejecuta en POST, desde navegador en GET
  res.send({ logged: true, mensaje: feedback.mansaje, user: req.user });
});

app.all("/api/fail", function (req, res) {
  res.send({ logged: false, mensaje: feedback.mensaje });
});

//logout

app.post("/users/logout", function (req, res) {
  req.logOut();
  res.send({ mensaje: "Logout Correcto" });
});

app.all("/users/perfil", function (req, res) {
  req.isAuthenticated()
    ? res.send({
        logged: true,
        mensaje: "Todo correcto: información sensible",
        user: req.user,
      })
    : res.send({ logged: false, mensaje: "Necesitas logearte. Denegado" });
});

app.post("/users/signup", function (req, res) {
  app.locals.db
    .collection("users")
    .find({ email: req.body.email })
    .toArray(function (err, user) {
      if (user.length === 0) {
        const saltYHash = creaPass(req.body.password);
        app.locals.db.collection("users").insertOne(
          {
            imagen: req.body.imagen,
            nombre: req.body.nombre,
            apellido1: req.body.apellido1,
            apellido2: req.body.apellido2,
            dni: req.body.dni,
            telf: req.body.telf,
            email: req.body.email,
            password: {
              hash: saltYHash.hash,
              salt: saltYHash.salt,
            },
          },
          function (err, respuesta) {
            if (err !== null) {
              console.log(err);
              res.send({ mensaje: "Ha habido un error: " + err });
            } else {
              res.send({ mensaje: "Usuario registrado" });
            }
          }
        );
      } else {
        res.send({ mensaje: "Usuario ya registrado" });
      }
    });
});

app.put("users/editar", function (req, res) {
  let email = req.body.email;
  let nombre = req.body.nombre;
  let apellidoA = req.body.apellidoA;
  let apellidoB = req.body.apellidoB;
  let telefono = req.body.telefono;
  let dni = req.body.dni;
  let imagen = req.body.imagen;

  app.locals.db.collection(users).updateOne(
    { email: email },
    {
      $set: {
        nombre: nombre,
        apellidoA: apellidoA,
        apellidoB: apellidoB,
        trlrfono: telefono,
        dni: dni,
        imagen: imagen,
      },
    },
    function (error, datos) {
      error
        ? res.send({ mensaje: "tenemos un error" + error })
        : res.send({ mensaje: "usuario editado" });
    }
  );
});

app.delete("/users/delete", function (req, res) {
  if (req.isAuthenticated() === false) {
    return res.status(401).send({ mensaje: "No logueado" });
  }

  req.app.locals.db
    .collection("users")
    .deleteOne({ email: req.body.email }, function (error, datos) {
      if (error !== null) {
        res.send({ mensaje: "Ha habido un error. " + error });
      } else {
        res.send({ mensaje: "Eliminado correctamente" });
      }
    });
});
// ------------------- FUNCIONES CRYPTO PASSWORD -------------------------

/**
 *
 * @param {*} password -> Recibe el password a encriptar
 * @returns -> Objeto con las claves salt y hash resultantes.
 */

function creaPass(password) {
  var salt = crypto.randomBytes(32).toString("hex");
  var genHash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");

  return {
    salt: salt,
    hash: genHash,
  };
}

/**
 *
 * @param {*} password -> Recibe el password a comprobar
 * @param {*} hash -> Recibe el hash almacenado a comprobar
 * @param {*} salt -> Recibe el salt almacenado a comprobar
 * @returns -> Booleano ( true si es el correcto, false en caso contrario)
 */

function validoPass(password, hash, salt) {
  var hashVerify = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return hash === hashVerify;
}
//-----------------------------------------------------------------------------------
app.listen(puerto, function (err) {
  err
    ? console.log("error en el servidor")
    : console.log("servidor en escucha al puerto:" + puerto);
});
