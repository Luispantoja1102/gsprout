const juegoSchema = require("../models/juego.model");
const juegoService = require("../services/juego.service");
const cryptojsUtil = require("../utils/cryptojs.util");

// Para redis
const juegoSalt = "juego";

//Creacion de juegos
const createJuego = async (req, res, next) => {
  let { error, value } = juegoSchema.validate(req.body);
  if (error) {
    //Si hay un error en la validacion
    return res.status(400).send(error.details);
  }

  if (await juegoService.getJuegoByName(value.nombre)) {
    //Niega la creacion si este existe
    return res.status(400).send("Juego existe");
  }

  // Encripta el regex de la licencia
  value.regexLicense = await cryptojsUtil.encrypt(value.regexLicense);
  try {
    const juego = await juegoService.createJuego(value);
    req.redis = {
      key: `${juegoSalt}`,
      data: juego,
      status: 201,
    };
    next();
    // return res.status(201).send(juego);
  } catch (error) {
    return res.status(500).send(error);
  }
};

//Creacion de varios juegos
const createSeveralJuegos = async (req, res, next) => {
  let juegos = req.body;
  for (let i = 0; i < juegos.length; i++) {
    juegos[i].regexLicense = juegos[i].regex;
    delete juegos[i].regex;
    juegos[i].regexLicense = bcryptUtil.hashPassword(juegos[i].regexLicense);
    juegos[i].precio = 1;
    try {
      const juego = await juegoService.createJuego(juegos[i]);
    } catch (error) {
      return res.status(500).send(error);
    }
  }
  req.redis = {
    key: `${juegoSalt}`,
    data: juegos,
    status: 201,
  };
  next();
  // return res.status(201).send(juegos);
};

//Obtencion de juegos
const getJuegos = async (req, res, next) => {
  try {
    const juegos = await juegoService.getJuegos();

    req.redis = {
      key: `${juegoSalt}`,
      data: juegos,
    };
    next();
  } catch {
    return res.status(500).send("Internal Server Error");
  }
};

//Obtencion de juego por id
const getJuegoById = async (req, res, next) => {
  try {
    const juego = await juegoService.getJuegoById(req.params.id);
    if (!juego) return res.status(404).send("Juego no existe");
    req.data = juego;
    next();
    // return res.status(200).send(juego);
  } catch {
    return res.status(500).send("Internal Server Error");
  }
};

//Actualizar juego
const updateJuego = async (req, res,next) => {
  let { error, value } = juegoSchema.validate(req.body);
  if (error) {
    //Si hay un error en la validacion
    return res.status(400).send(error.details);
  }
  try {
    const juego = await juegoService.updateJuego(req.params.id, value);
    if (!juego) return res.status(404).send("Juego no existe");

    req.redis = {
      key: `${juegoSalt}:${req.params.id}`,
      data: juego,
      status: 200,
    };
    next();
    // return res.status(200).send(juego);
  } catch {
    return res.status(500).send(error);
  }
};

//Eliminar juego
const deleteJuego = async (req, res,next) => {
  try {
    const juego = await juegoService.deleteJuego(req.params.id);
    if (!juego) return res.status(404).send("Juego no existe");

    req.redis = {
      key: `${juegoSalt}:${req.params.id}`,
      data: juego,
      status: 200,
    };
    next();
    // return res.status(200).send(juego);
  } catch {
    return res.status(500).send(error);
  }
};

const generateCacheKey = (req, res, next) => {
  const { id } = req.params;
  const key = id ? `${juegoSalt}:${id}` : `${juegoSalt}`;
  req.redis = {
    key
  };
  next();
};
module.exports = {
  createJuego,
  getJuegos,
  getJuegoById,
  updateJuego,
  deleteJuego,
  createSeveralJuegos,
  generateCacheKey,
};
