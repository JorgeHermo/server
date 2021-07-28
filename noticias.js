const express = require("express");
const mongodb = require("mongodb");
const router = express.Router();

router.get("/noticias", function (req, res) {
  let db = req.app.locals.db;
  db.collection("noticias")
    .find()
    .toArray(function (error, datos) {
      if (error !== null) {
        res.send({ mensaje: "Tenemos un error." + error });
      } else {
        res.send(datos);
      }
    });
});

router.post("/anhadir", function (req, res) {
  let db = req.app.locals.db;
  db.collection("noticias")
    .find({ nombreBanda: req.body.nombreBanda })
    .toArray(function (error, datos) {
      if (error !== null) {
        res.send({ mensaje: "tenemos un error." + error });
      } else if (datos.length === 0) {
        db.collection("noticias").insertOne(
          {
            tituloNoticia: req.body.tituloNoticia,
            imagen: req.body.imagen,
            contenidoNoticia: req.body.contenidoNoticia,
          },
          function (error, datos) {
            if (error !== null) {
              res.send({ mensaje: "Tenemos un error." + error });
            } else {
              res.send({
                error: false,
                mensaje: "Noticia añadida",
              });
            }
          }
        );
      }
    });
});

router.delete("/eliminar", function (req, res) {
  let db = req.app.locals.db;
  db.collection("noticias").deleteOne(
    { nombreBanda: req.body.nombreBanda },
    function (error, datos) {
      if (error !== null) {
        res.send({ mensaje: "tenemos un error.", error: error });
      } else {
        res.send({ mensaje: "Noticia eliminada", datos: datos });
      }
    }
  );
});

module.exports = router;
