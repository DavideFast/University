const GROUP_ID = 1;
const SALT = "694381555";

// seed = timestamp del giorno corrente (come PHP)
function getSeed() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor(today.getTime() / 1000);
}

export function registerPlayerListAPI(req, res, db) {
  // headers download JSON
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=stats.json");

  // 🔹 VERSIONE TEST (equivalente al tuo echo json_encode([...]))
  /*
  return res.json([
    "Alessandro",
    "Lorenzo",
    "Francesco",
    "Mattia",
    "Leonardo",
    "Riccardo",
    "Gabriele",
    "Edoardo",
    "Tommaso",
    "Giuseppe",
    "Antonio",
    "Giovanni",
    "Pietro",
    "Matteo",
    "Filippo",
    "Federico",
    "Marco",
    "Luca",
    "Andrea",
    "Davide",
    "Simone",
    "Michele",
    "Christian",
    "Stefano",
    "Nicola",
    "Domenico",
    "Salvatore",
    "Roberto",
    "Luigi",
    "Emanuele",
    "Sofia",
    "Giulia",
    "Aurora",
    "Alice",
    "Ginevra",
    "Emma",
    "Giorgia",
    "Beatrice",
    "Greta"
  ]);
  */

  // 🔹 VERSIONE REALE (equivalente SQL + md5)
  const seed = getSeed();

  const pingtime_Persona = [...new Map(db.data.exam_Calendario.map((p) => [p.alias, { alias: p.alias, gruppo: p.gruppo }])).values()];
  const aliases = pingtime_Persona //<-----------Da generare
    .filter((p) => p.gruppo === GROUP_ID)
    .sort((a, b) => a.alias.localeCompare(b.alias))
    .map((p) => ({
      alias: p.alias,
    }));
  //.map((p) => crypto.createHash("md5").update(`${p.alias}${seed}${SALT}`).digest("hex"));

  res.json(aliases);
}
