const express = require("express");
const mongodb = require("mongodb");
const router = express.Router();

router.get("/bandas", function (req, res) {
  let db = req.app.locals.db;
  db.collection("bandas")
    .find()
    .toArray(function (error, datos) {
      ;
      if (error !== null) {
        res.send({ mensaje: "Tenemos un error." + error });
      } else {
        res.send(datos);
      }
    });
});

router.post("/anhadir", function (req, res) {
  let db = req.app.locals.db;
  db.collection("bandas")
    .find({ nombreBanda: req.body.nombreBanda })
    .toArray(function (error, datos) {
      if (error !== null) {
        res.send({ mensaje: "tenemos un error." + error });
      } else if (datos.length === 0) {
        db.collection("bandas").insertOne(
          {
            nombreBanda: req.body.nombreBanda,
            generoBanda: req.body.generoBanda,
            imagen: req.body.imagen,
            descripBanda: req.body.descripBanda,
            links: {
              spotify: req.body.links.spotify,
              appleMusic: req.body.links.appleMusic,
              deezer: req.body.links.deezer,
              instagram: req.body.links.instagram,
              facebook: req.body.links.facebook,
            },
          },
          function (error, datos) {
            if (error !== null) {
              res.send({ mensaje: "Tenemos un error." + error });
            } else {
              res.send({
                error: false,
                mensaje: "Banda añadida",
              });
            }
          }
        );
      } else {
        res.send({ mensaje: "banda ya registrada" });
      }
    });
});

router.delete("/eliminar", function (req, res) {
  let db = req.app.locals.db;
  db.collection("bandas").deleteOne(
    { nombreBanda: req.body.nombreBanda },
    function (error, datos) {
      if (error !== null) {
        res.send({ mensaje: "tenemos un error.", error: error });
      } else {
        res.send({ mensaje: "Banda eliminada", datos: datos });
      }
    }
  );
});

module.exports = router;
