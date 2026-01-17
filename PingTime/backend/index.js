import express from "express";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { projection } from "./API/select.js";
import { innerJoinFlat } from "./API/join.js";
import cors from "cors";
import { registerSpaceOccupationAPI } from "./API/spaceOccupation.js";
import { registerAdjMatrixAPI } from "./API/adjMatrix.js";
import { registeredAttendencesAPI } from "./API/attendeces.js";
import { registeredGeneralStatsAPI } from "./API/generalStats.js";
import { registerPlayerListAPI } from "./API/playerList.js";
import { registerGetCalendarioRawAPI } from "./API/getCalendarioRaw.js";
import { registerGetFasciaOrariaRawAPI } from "./API/getFasciaOrariaRaw.js";

const app = express();
app.use(express.json());
app.use(cors());

// setup lowdb
const adapter = new JSONFile("./db_mock/db_mock.json");
const db = new Low(adapter, { exam_Calendario: [], pingtime_Fascia_Oraria: [] });
await db.read();

// ===== GET routes =====

//KPI CARDS
app.get("/dataVis/generalStats", (req, res) => {
  registeredGeneralStatsAPI(req, res, db);
});

//HEATMAP
app.get("/dataVis/spaceOccupation", (req, res) => {
  res.json(registerSpaceOccupationAPI(req, res, db));
});

//RADIAL BAR
app.get("/dataVis/adjMatrix", async (req, res) => {
  res.json(registerAdjMatrixAPI(req, db));
});

//RESTITUISCE CSV DEGLI ATTENDENCES
app.get("/dataVis/attendences", (req, res) => {
  res.json(registeredAttendencesAPI(req, res, db));
});

//RESTITUISCE JSON DEI PLAYER
app.get("/dataVis/player", (req, res) => {
  registerPlayerListAPI(req, res, db);
});

//RAW CALENDARIO DATA
app.get("/dataVis/getCalendarioRaw", (req, res) => {
  registerGetCalendarioRawAPI(req, res, db);
});

//RAW FASCIA ORARIA DATA
app.get("/dataVis/getFasciaOrariaRaw", (req, res) => {
  registerGetFasciaOrariaRawAPI(req, res, db);
});

// ===== Avvio server =====
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
