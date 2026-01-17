const fs = require("fs");
const path = require("path");

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("Uso: node sql-to-json.js dump.sql");
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, "utf8");

const db = {};

const insertRegex = /INSERT INTO\s+`?(\w+)`?\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+?);/gi;

let match;

while ((match = insertRegex.exec(sql)) !== null) {
  const table = match[1];
  const columns = match[2].split(",").map((c) => c.replace(/`/g, "").trim());

  const valuesBlock = match[3].replace(/\n/g, "").trim();

  const rows = valuesBlock.slice(1, -1).split("),(");

  if (!db[table]) db[table] = [];

  rows.forEach((row) => {
    const values = row.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map((v) => v.trim().replace(/^'/, "").replace(/'$/, "").replace(/\\'/g, "'"));

    const obj = {};
    columns.forEach((col, i) => {
      let val = values[i];

      if (val === "NULL") val = null;
      else if (!isNaN(val)) val = Number(val);

      obj[col] = val;
    });

    db[table].push(obj);
  });
}

fs.writeFileSync("db_mock.json", JSON.stringify(db, null, 2), "utf8");

console.log("✅ db.json creato con successo");
