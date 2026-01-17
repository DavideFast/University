import * as d3 from "d3";
import { getIntervalloSettimanale, getIntervalloMensile } from "./Utility";

function ottimizzaOrarioPresenze(db_calendario) {
  //Creo un'array di dimensione pari al numero delle fasce
  var join = new Array(db_calendario.length);
  //Copio le informazioni della fascia i-esima nell'array in posizione i-esima
  for (let i = 0; i < db_calendario.length; i++) {
    join[i] = {};
    join[i].inizio = db_calendario[i].inizio;
    join[i].fine = db_calendario[i].fine;
    join[i].giorno = db_calendario[i].giorno;
    if (join[i].giorno === "Domenica") join[i].giorno_numerico = 0;
    if (join[i].giorno === "Lunedì") join[i].giorno_numerico = 1;
    if (join[i].giorno === "Martedì") join[i].giorno_numerico = 2;
    if (join[i].giorno === "Mercoledì") join[i].giorno_numerico = 3;
    if (join[i].giorno === "Giovedì") join[i].giorno_numerico = 4;
    if (join[i].giorno === "Venerdì") join[i].giorno_numerico = 5;
    if (join[i].giorno === "Sabato") join[i].giorno_numerico = 6;
    join[i].day = new Date(db_calendario[i].day); //getGiornoDaSettimana(db_calendario[i].settimana, join[i].giorno_numerico, db_calendario[i].anno);
    join[i].id = db_calendario[i].id;
  }

  //Ordino in ordine cronologico
  join.sort((a, b) => {
    return d3.ascending(a.day, b.day);
  });

  return join;
}

function creaArrayPerGraficoSettimana(join, codominio) {
  //Calcola quanti giorni sono presenti sull'asse y visibile

  const giorni = 7; //Math.floor((codominio[1] - codominio[0]) / (1000 * 60 * 60 * 24));
  //Crea un array di dimensione pari al numero di tick del dominio per il numero di tick del codominio del grafico
  var arrayFasce = new Array(giorni * 24 * 12);
  for (let i = 0; i < giorni; i++) {
    for (let j = 0; j < 288; j++) {
      arrayFasce[i * 288 + j] = {};
      arrayFasce[i * 288 + j].valore = 0;

      if (j < 120) {
        if (j % 12 === 0) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":00";
        else if (j % 12 === 1) {
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":05";
        } else if (j % 12 === 2) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":10";
        else if (j % 12 === 3) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":15";
        else if (j % 12 === 4) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":20";
        else if (j % 12 === 5) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":25";
        else if (j % 12 === 6) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":30";
        else if (j % 12 === 7) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":35";
        else if (j % 12 === 8) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":40";
        else if (j % 12 === 9) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":45";
        else if (j % 12 === 10) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":50";
        else if (j % 12 === 11) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":55";
      } else {
        if (j % 12 === 0) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":00";
        else if (j % 12 === 1) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":05";
        else if (j % 12 === 2) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":10";
        else if (j % 12 === 3) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":15";
        else if (j % 12 === 4) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":20";
        else if (j % 12 === 5) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":25";
        else if (j % 12 === 6) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":30";
        else if (j % 12 === 7) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":35";
        else if (j % 12 === 8) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":40";
        else if (j % 12 === 9) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":45";
        else if (j % 12 === 10) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":50";
        else if (j % 12 === 11) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":55";
      }
      if (i === 0) arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(codominio[0], 0);
      if (i === 1) arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(codominio[0], 1);
      if (i === 2) arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(codominio[0], 2);
      if (i === 3) arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(codominio[0], 3);
      if (i === 4) arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(codominio[0], 4);
      if (i === 5) arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(codominio[0], 5);
      if (i === 6) arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(codominio[0], 6);
    }
  }
  //Eliminare tutti i dati che hanno codominio fuori dal range
  join = join.filter((item) => item.day >= codominio[0] && item.day < codominio[1]);
  // assegna un id incrementale (0,1,2,...) per ogni giorno distinto in join
  const dayIdMap = new Map();
  let nextDayId = 0;
  for (let i = 0; i < join.length; i++) {
    const dayKey = +d3.utcDay.floor(join[i].day);
    if (!dayIdMap.has(dayKey)) dayIdMap.set(dayKey, nextDayId++);
    join[i].giorno_id = dayIdMap.get(dayKey);
  }

  //Per ogni presenza in un certo intervallo orario aggiornare il valore di 1
  for (let i = 0; i < join.length; i++) {
    const inizio = join[i].inizio;
    const fine = join[i].fine;
    const giorno = join[i].giorno_id;
    const index_inizio = giorno * 288 + (inizio.split(":")[0] * 12 + inizio.split(":")[1] / 5);
    const index_fine = giorno * 288 + (fine.split(":")[0] * 12 + fine.split(":")[1] / 5);

    for (let j = index_inizio; j < index_fine; j++) {
      arrayFasce[j].valore += 1;
      if (arrayFasce[j].persone !== undefined) arrayFasce[j].persone = join[i].id + "," + arrayFasce[j].persone;
      else arrayFasce[j].persone = join[i].id;
    }
  }
  return arrayFasce;
}

function getIndexFromWeeks(codominio, dimensione) {
  var contatore = 0;
  var settimane = 0;
  var array = new Array(dimensione);
  while (codominio[1] - d3.utcDay.offset(codominio[0], contatore) > 0) {
    contatore = contatore + 1;
    if (d3.utcDay.offset(codominio[0], contatore - 1).getDay() === 1) {
      settimane = settimane + 1;
      array[settimane - 1] = d3.utcDay.offset(codominio[0], contatore - 1);
    }
  }
  return array;
}

function creaArrayPerGraficoMese(join, codominio, media) {
  //Calcola quanti giorni sono presenti sull'asse y visibile
  var contatore = 0;
  var settimane = 0;
  while (codominio[1] - d3.utcDay.offset(codominio[0], contatore) > 0) {
    contatore = contatore + 1;
    if (d3.utcDay.offset(codominio[0], contatore - 1).getDay() === 1) {
      settimane = settimane + 1;
    }
  }
  contatore = 0;
  var array = getIndexFromWeeks(codominio, settimane);

  //Crea un array di dimensione pari al numero di tick del dominio per il numero di tick del codominio del grafico
  var arrayFasce = new Array(settimane * 24 * 12);
  for (let i = 0; i < settimane; i++) {
    for (let j = 0; j < 288; j++) {
      arrayFasce[i * 288 + j] = {};
      arrayFasce[i * 288 + j].valore = 0;
      arrayFasce[i * 288 + j].numero_settimane = settimane;

      if (j < 120) {
        if (j % 12 === 0) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":00";
        else if (j % 12 === 1) {
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":05";
        } else if (j % 12 === 2) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":10";
        else if (j % 12 === 3) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":15";
        else if (j % 12 === 4) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":20";
        else if (j % 12 === 5) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":25";
        else if (j % 12 === 6) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":30";
        else if (j % 12 === 7) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":35";
        else if (j % 12 === 8) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":40";
        else if (j % 12 === 9) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":45";
        else if (j % 12 === 10) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":50";
        else if (j % 12 === 11) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":55";
      } else {
        if (j % 12 === 0) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":00";
        else if (j % 12 === 1) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":05";
        else if (j % 12 === 2) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":10";
        else if (j % 12 === 3) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":15";
        else if (j % 12 === 4) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":20";
        else if (j % 12 === 5) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":25";
        else if (j % 12 === 6) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":30";
        else if (j % 12 === 7) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":35";
        else if (j % 12 === 8) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":40";
        else if (j % 12 === 9) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":45";
        else if (j % 12 === 10) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":50";
        else if (j % 12 === 11) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":55";
      }
      arrayFasce[i * 288 + j].settimana = array[i];
    }
  }
  //Eliminare tutti i dati che hanno codominio fuori dal range
  var inRange = new Date(Date.UTC(codominio[0].getFullYear(), codominio[0].getMonth(), codominio[0].getDate()));
  var outRange = new Date(Date.UTC(codominio[1].getFullYear(), codominio[1].getMonth(), codominio[1].getDate()));

  join = join.filter((item) => item.day >= inRange && item.day < outRange);
  //Per ogni presenza in un certo intervallo orario aggiornare il valore di 1
  for (let i = 0; i < join.length; i++) {
    const inizio = join[i].inizio;
    const fine = join[i].fine;
    var giorno_join = new Date(join[i].day).setHours(0);
    var settimana = 0;
    for (var k = 0; k < array.length; k++) {
      if (array[k].setHours(0) <= giorno_join) settimana = settimana + 1;
    }
    const index_inizio = (settimana - 1) * 288 + (inizio.split(":")[0] * 12 + inizio.split(":")[1] / 5);
    const index_fine = (settimana - 1) * 288 + (fine.split(":")[0] * 12 + fine.split(":")[1] / 5);

    for (let j = index_inizio; j < index_fine; j++) {
      arrayFasce[j].valore += 1;
    }
  }

  //Faccio la media
  if (media === 2) {
    for (let i = 0; i < arrayFasce.length; i++) {
      arrayFasce[i].valore = arrayFasce[i].valore / 7;
    }
  }

  var massimo = 0;
  var minimo = 100;
  var giorni;
  //Faccio il minimo
  if (media === 3) {
    for (let i = 0; i < settimane; i++) {
      giorni = creaArrayPerGraficoSettimana(join, [getIntervalloSettimanale(array[i]).inizio, getIntervalloSettimanale(array[i]).fine]);
      for (let j = 0; j < 288; j++) {
        for (let k = 0; k < 7; k++) {
          if (minimo > giorni[k * 288 + j].valore) {
            minimo = giorni[k * 288 + j].valore;
          }
        }
        arrayFasce[i * 288 + j].valore = minimo;
        minimo = 100;
      }
    }
  }
  //Faccio il massimo
  if (media === 4) {
    for (let i = 0; i < settimane; i++) {
      giorni = creaArrayPerGraficoSettimana(join, [getIntervalloSettimanale(array[i]).inizio, getIntervalloSettimanale(array[i]).fine]);
      for (let j = 0; j < 288; j++) {
        for (let k = 0; k < 5; k++) {
          if (massimo < giorni[k * 288 + j].valore) {
            massimo = giorni[k * 288 + j].valore;
          }
        }
        arrayFasce[i * 288 + j].valore = massimo;
        massimo = 0;
      }
    }
  }
  return arrayFasce;
}

function creaArrayPerGraficoAnno(join, codominio, media) {
  //Calcola quanti giorni sono presenti sull'asse y visibile
  const mesi = 12;
  const anno = codominio[0].getFullYear();
  //Crea un array di dimensione pari al numero di tick del dominio per il numero di tick del codominio del grafico
  var arrayFasce = new Array(mesi * 24 * 12);
  for (let i = 0; i < mesi; i++) {
    for (let j = 0; j < 288; j++) {
      arrayFasce[i * 288 + j] = {};
      arrayFasce[i * 288 + j].valore = 0;
      arrayFasce[i * 288 + j].minimo = 0;
      arrayFasce[i * 288 + j].massimo = 0;

      if (j < 120) {
        if (j % 12 === 0) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":00";
        else if (j % 12 === 1) {
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":05";
        } else if (j % 12 === 2) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":10";
        else if (j % 12 === 3) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":15";
        else if (j % 12 === 4) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":20";
        else if (j % 12 === 5) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":25";
        else if (j % 12 === 6) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":30";
        else if (j % 12 === 7) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":35";
        else if (j % 12 === 8) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":40";
        else if (j % 12 === 9) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":45";
        else if (j % 12 === 10) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":50";
        else if (j % 12 === 11) arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":55";
      } else {
        if (j % 12 === 0) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":00";
        else if (j % 12 === 1) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":05";
        else if (j % 12 === 2) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":10";
        else if (j % 12 === 3) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":15";
        else if (j % 12 === 4) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":20";
        else if (j % 12 === 5) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":25";
        else if (j % 12 === 6) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":30";
        else if (j % 12 === 7) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":35";
        else if (j % 12 === 8) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":40";
        else if (j % 12 === 9) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":45";
        else if (j % 12 === 10) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":50";
        else if (j % 12 === 11) arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":55";
      }

      if (i === 0) arrayFasce[i * 288 + j].mese = new Date(anno, 0, 1);
      if (i === 1) arrayFasce[i * 288 + j].mese = new Date(anno, 1, 1);
      if (i === 2) arrayFasce[i * 288 + j].mese = new Date(anno, 2, 1);
      if (i === 3) arrayFasce[i * 288 + j].mese = new Date(anno, 3, 1);
      if (i === 4) arrayFasce[i * 288 + j].mese = new Date(anno, 4, 1);
      if (i === 5) arrayFasce[i * 288 + j].mese = new Date(anno, 5, 1);
      if (i === 6) arrayFasce[i * 288 + j].mese = new Date(anno, 6, 1);
      if (i === 7) arrayFasce[i * 288 + j].mese = new Date(anno, 7, 1);
      if (i === 8) arrayFasce[i * 288 + j].mese = new Date(anno, 8, 1);
      if (i === 9) arrayFasce[i * 288 + j].mese = new Date(anno, 9, 1);
      if (i === 10) arrayFasce[i * 288 + j].mese = new Date(anno, 10, 1);
      if (i === 11) arrayFasce[i * 288 + j].mese = new Date(anno, 11, 1);
    }
  }
  //Eliminare tutti i dati che hanno codominio fuori dal range
  join = join.filter((item) => item.day >= codominio[0] && item.day < codominio[1]);

  var minimo;
  var massimo;
  //Per ogni presenza in un certo intervallo orario aggiornare il valore di 1
  for (let i = 0; i < join.length; i++) {
    const inizio = join[i].inizio;
    const fine = join[i].fine;
    const mese = join[i].day.getMonth();
    minimo = 100;
    massimo = 0;

    const index_inizio = mese * 288 + (inizio.split(":")[0] * 12 + inizio.split(":")[1] / 5);
    const index_fine = mese * 288 + (fine.split(":")[0] * 12 + fine.split(":")[1] / 5);

    for (let j = index_inizio; j < index_fine; j++) {
      arrayFasce[j].valore += 1;
    }
  }

  //Calcolo la media quando richiesto
  if (media === 2) {
    for (let i = 0; i < arrayFasce.length; i++) {
      arrayFasce[i].valore = arrayFasce[i].valore / 31;
    }
  }

  var numeroSettimane;

  //Calcolo minimo
  minimo = 100;
  massimo = 0;
  var meseIndex = 0;
  var arrayAppoggio;
  if (media === 3)
    while (meseIndex < 12) {
      arrayAppoggio = creaArrayPerGraficoMese(join, [getIntervalloMensile(new Date(Date.UTC(anno, meseIndex, 1))).inizio, getIntervalloMensile(new Date(Date.UTC(anno, meseIndex, 1))).fine], 3);
      if (meseIndex === 10) {
      }
      numeroSettimane = arrayAppoggio.length / 288;
      for (let j = 0; j < 288; j++) {
        for (let i = 0; i < numeroSettimane; i++) {
          if (meseIndex === 10 && j > 203 && j < 229) {
          }
          if (minimo > arrayAppoggio[i * 288 + j].valore) minimo = arrayAppoggio[j + i * 288].valore;
        }
        arrayFasce[meseIndex * 288 + j].valore = minimo;
        minimo = 100;
      }

      meseIndex = meseIndex + 1;
    }

  //Calcolo massimo
  if (media === 4)
    while (meseIndex < 12) {
      arrayAppoggio = creaArrayPerGraficoMese(join, [getIntervalloMensile(new Date(anno, meseIndex, 1)).inizio, getIntervalloMensile(new Date(anno, meseIndex, 1)).fine], 4);
      numeroSettimane = arrayAppoggio.length / 288;
      for (let j = 0; j < 288; j++) {
        for (let i = 0; i < numeroSettimane; i++) {
          if (massimo < arrayAppoggio[i * 288 + j].valore) massimo = arrayAppoggio[j + i * 288].valore;
        }
        arrayFasce[meseIndex * 288 + j].valore = massimo;
        massimo = 0;
      }
      meseIndex = meseIndex + 1;
    }

  return arrayFasce;
}

export async function data_formatting(codominio, tipologia, media) {
  //Sulla base del giorno scelto, calcolo la settimana corrispondente
  var settimana = d3.utcWeek.count(d3.utcYear(codominio[0]), codominio[0]) + 1;
  var anno = codominio[0].getUTCFullYear();
  var settimana1 = anno + "_" + String(settimana).padStart(2, "0");
  settimana = d3.utcWeek.count(d3.utcYear(codominio[1]), codominio[1]) + 1;
  anno = codominio[1].getUTCFullYear();
  var settimana2 = anno + "_" + String(settimana + 1).padStart(2, "0");
  var string = process.env.REACT_APP_SPACE_OCCUPATION + "?startWeek=" + settimana1 + "&endWeek=" + settimana2;
  return d3.json(string).then(function (db_calendario) {
    if (tipologia === 1) return creaArrayPerGraficoSettimana(ottimizzaOrarioPresenze(db_calendario), codominio);
    if (tipologia === 2) return creaArrayPerGraficoMese(ottimizzaOrarioPresenze(db_calendario), codominio, media);
    if (tipologia === 3) return creaArrayPerGraficoAnno(ottimizzaOrarioPresenze(db_calendario), codominio, media);
  });
}
