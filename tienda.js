const express = require("express");
const router = express.Router();
const mongodb = require("mongodb");

router.get("/tienda", function (req, res) {
  let db = req.app.locals.db;
  db.collection("tienda")
    .find()
    .toArray(function (error, datos) {
      if (error !== null) {
        res.send({ mensaje: "tenemos problema" + error });
      } else {
        res.send(datos);
      }
    });
});

router.post("/anhadir", function (req, res) {
  let db = req.app.locals.db;
  db.collection("tienda")
    .find({ idArticulo: req.body.idArticulo })
    .toArray(function (error, datos) {
      if (error !== null) {
        res.send({ mensaje: "tenemos un problema" + error });
      } else if (datos.length === 0) {
        db.collection("tienda").insertOne(
          {
            idArticulo: req.body.idArticulo,
            imagen: req.body.imagen,
            nombreArticulo: req.body.nombreArticulo,
            tallaArticulo: {
              xs: req.body.tallaArticulo.xs,
              s: req.body.tallaArticulo.s,
              m: req.body.tallaArticulo.m,
              l: req.body.tallaArticulo.l,
              xl: req.body.tallaArticulo.xl,
            },
            precioArticulo: req.body.precioArticulo,
          },
          function (error, datos) {
            if (error !== null) {
              res.send({ mensaje: "tenemos un error" });
            } else {
              res.send({
                error: false,
                mensaje: "articulo añadido",
              });
            }
          }
        );
      } else {
        res.send({ mensaje: "articulo ya añadido" });
      }
    });
});

router.delete("/eliminar", function (req, res) {
  let db = req.app.locals.db;
  db.collection("tienda").deleteOne(
    { nombreBanda: req.body.nombreBanda },
    function (error, datos) {
      if (error !== null) {
        res.send({ mensaje: "tenemos un error.", error: error });
      } else {
        res.send({ mensaje: "Articulo eliminado", datos: datos });
      }
    }
  );
});

module.exports = router;
