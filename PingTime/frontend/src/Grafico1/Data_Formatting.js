import * as d3 from "d3";
import { getGiornoDaSettimana } from "./Utility";

function creaArrayFascia(fasce) {
  fasce.sort((a, b) => {
    return a.id - b.id;
  });
  const dimensione_array_fascia = Number(fasce[fasce.length - 1].id);
  var newFascia = new Array(dimensione_array_fascia);
  for (let i = 0; i < fasce.length; i++) {
    newFascia[fasce[i].id] = fasce[i] ? fasce[i] : null;
  }
  return newFascia;
}

function joinFasceOrariePresenze(presenze, fasce) {
  var newData = new Array(presenze.length);

  for (let i = 0; i < presenze.length; i++) {
    newData[i] = {};

    newData[i].inizio = fasce[presenze[i].fascia_oraria].ora_inizio;
    newData[i].fine = fasce[presenze[i].fascia_oraria].ora_fine;
    newData[i].giorno = fasce[presenze[i].fascia_oraria].giorno;
    if (newData[i].giorno === "Domenica") newData[i].giorno_numerico = 0;
    if (newData[i].giorno === "Lunedì") newData[i].giorno_numerico = 1;
    if (newData[i].giorno === "Martedì") newData[i].giorno_numerico = 2;
    if (newData[i].giorno === "Mercoledì") newData[i].giorno_numerico = 3;
    if (newData[i].giorno === "Giovedì") newData[i].giorno_numerico = 4;
    if (newData[i].giorno === "Venerdì") newData[i].giorno_numerico = 5;
    if (newData[i].giorno === "Sabato") newData[i].giorno_numerico = 6;
    newData[i].day = getGiornoDaSettimana(
      presenze[i].settimana,
      newData[i].giorno_numerico
    );
  }

  newData.sort((a, b) => {
    return d3.ascending(a.ora_inizio, b.ora_fine);
  });
  console.log(newData);
  return newData;
}

function creaArrayPresenze(newData, dominio) {
  const giorni = Math.floor((dominio[1] - dominio[0]) / (1000 * 60 * 60 * 24));

  var arrayFasce = new Array(giorni * 24 * 12); //7 giorni x 24 ore x 12 quarti d'ora
  for (let i = 0; i < giorni; i++) {
    for (let j = 0; j < 288; j++) {
      arrayFasce[i * 288 + j] = {};
      arrayFasce[i * 288 + j].valore = 0;

      if (j < 120) {
        if (j % 12 === 0)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":00";
        else if (j % 12 === 1) {
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":05";
        } else if (j % 12 === 2)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":10";
        else if (j % 12 === 3)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":15";
        else if (j % 12 === 4)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":20";
        else if (j % 12 === 5)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":25";
        else if (j % 12 === 6)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":30";
        else if (j % 12 === 7)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":35";
        else if (j % 12 === 8)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":40";
        else if (j % 12 === 9)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":45";
        else if (j % 12 === 10)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":50";
        else if (j % 12 === 11)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":55";
      } else {
        if (j % 12 === 0)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":00";
        else if (j % 12 === 1)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":05";
        else if (j % 12 === 2)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":10";
        else if (j % 12 === 3)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":15";
        else if (j % 12 === 4)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":20";
        else if (j % 12 === 5)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":25";
        else if (j % 12 === 6)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":30";
        else if (j % 12 === 7)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":35";
        else if (j % 12 === 8)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":40";
        else if (j % 12 === 9)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":45";
        else if (j % 12 === 10)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":50";
        else if (j % 12 === 11)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":55";
      }
      if (i === 0)
        arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(dominio[0], 6);
      if (i === 1)
        arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(dominio[0], 0);
      if (i === 2)
        arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(dominio[0], 1);
      if (i === 3)
        arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(dominio[0], 2);
      if (i === 4)
        arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(dominio[0], 3);
      if (i === 5)
        arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(dominio[0], 4);
      if (i === 6)
        arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(dominio[0], 5);
    }

    console.log(arrayFasce);
  }
  //Contare numero presenze per fascia oraria
  console.log("-------------");
  newData = newData.filter(
    (item) => item.day >= dominio[0] && item.day < dominio[1]
  );
  console.log(newData);

  for (let i = 0; i < newData.length; i++) {
    const inizio = newData[i].inizio;
    const fine = newData[i].fine;
    const giorno = newData[i].giorno_numerico;
    const index_inizio =
      giorno * 284 + (inizio.split(":")[0] * 12 + inizio.split(":")[1] / 5);
    const index_fine =
      giorno * 284 + (fine.split(":")[0] * 12 + fine.split(":")[1] / 5);
    for (let j = index_inizio; j < index_fine; j++) arrayFasce[j].valore += 1;
  }
  console.log(arrayFasce);

  return arrayFasce;
}

export function data_formatting(fasce, presenze, dominio) {
  console.log("--------: " + dominio);
  return creaArrayPresenze(
    joinFasceOrariePresenze(presenze, creaArrayFascia(fasce)),
    dominio
  );
}
