import * as d3 from "d3";
import { getGiornoDaSettimana, getIntervalloMensile } from "./Utility";

function creaArrayFascia(db_fasce) {
  db_fasce.sort((a, b) => {
    return a.id - b.id;
  });
  const dimensione_array_fascia = Number(db_fasce[db_fasce.length - 1].id);
  var arrayFascia = new Array(dimensione_array_fascia);
  for (let i = 0; i < db_fasce.length; i++) {
    arrayFascia[db_fasce[i].id] = db_fasce[i] ? db_fasce[i] : null;
  }
  return arrayFascia;
}

function joinFasceOrariePresenze(db_calendario, db_fasce) {
  //Creo un'array di dimensione pari al numero delle fasce
  var join = new Array(db_calendario.length);

  //Copio le informazioni della fascia i-esima nell'array in posizione i-esima
  for (let i = 0; i < db_calendario.length; i++) {
    join[i] = {};
    join[i].inizio = db_fasce[db_calendario[i].fascia_oraria].ora_inizio;
    join[i].fine = db_fasce[db_calendario[i].fascia_oraria].ora_fine;
    join[i].giorno = db_fasce[db_calendario[i].fascia_oraria].giorno;
    if (join[i].giorno === "Domenica") join[i].giorno_numerico = 0;
    if (join[i].giorno === "Lunedì") join[i].giorno_numerico = 1;
    if (join[i].giorno === "Martedì") join[i].giorno_numerico = 2;
    if (join[i].giorno === "Mercoledì") join[i].giorno_numerico = 3;
    if (join[i].giorno === "Giovedì") join[i].giorno_numerico = 4;
    if (join[i].giorno === "Venerdì") join[i].giorno_numerico = 5;
    if (join[i].giorno === "Sabato") join[i].giorno_numerico = 6;
    join[i].day = getGiornoDaSettimana(db_calendario[i].settimana, join[i].giorno_numerico);
  }

  //Ordino in ordine cronologico
  join.sort((a, b) => {
    return d3.ascending(a.day, b.day);
  });

  return join;
}

function creaArrayPerGraficoSettimana(join, codominio) {
  //Calcola quanti giorni sono presenti sull'asse y visibile
  const giorni = Math.floor((codominio[1] - codominio[0]) / (1000 * 60 * 60 * 24));

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
    var lock = true;
    const giorno = join[i].giorno_id;
    const index_inizio = giorno * 288 + (inizio.split(":")[0] * 12 + inizio.split(":")[1] / 5);
    const index_fine = giorno * 288 + (fine.split(":")[0] * 12 + fine.split(":")[1] / 5);

    for (let j = index_inizio; j < index_fine; j++) arrayFasce[j].valore += 1;
    lock = true;
  }

  console.log(arrayFasce);
  console.log("STEP 2");
  return arrayFasce;
}

function getIndexFromWeeks(codominio, dimensione) {
  var contatore = 0;
  var settimane = 0;
  var array = new Array(dimensione);
  console.log(dimensione);
  while (codominio[1] - d3.utcDay.offset(codominio[0], contatore) > 0) {
    contatore = contatore + 1;
    if (d3.utcDay.offset(codominio[0], contatore - 1).getDay() === 1) {
      settimane = settimane + 1;
      array[settimane - 1] = d3.utcDay.offset(codominio[0], contatore - 1);
    }
  }
  console.log(array);
  return array;
}

function creaArrayPerGraficoMese(join, codominio, media) {
  //Calcola quanti giorni sono presenti sull'asse y visibile
  console.log(codominio);
  const anno = codominio[0].getFullYear();
  const mese = codominio[0].getMonth();
  var contatore = 0;
  var settimane = 0;
  while (codominio[1] - d3.utcDay.offset(codominio[0], contatore) > 0) {
    contatore = contatore + 1;
    if (d3.utcDay.offset(codominio[0], contatore - 1).getDay() === 1) settimane = settimane + 1;
  }
  contatore = 0;
  var array = getIndexFromWeeks(codominio, settimane);
  console.log(array);

  //Crea un array di dimensione pari al numero di tick del dominio per il numero di tick del codominio del grafico
  var arrayFasce = new Array(settimane * 24 * 12);
  for (let i = 0; i < settimane; i++) {
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
      arrayFasce[i * 288 + j].settimana = array[i];
    }
  }
  console.log(arrayFasce);
  //Eliminare tutti i dati che hanno codominio fuori dal range
  join = join.filter((item) => item.day >= codominio[0] && item.day < codominio[1]);
  //Per ogni presenza in un certo intervallo orario aggiornare il valore di 1
  for (let i = 0; i < join.length; i++) {
    const inizio = join[i].inizio;
    const fine = join[i].fine;
    var lock = true;
    var giorno_join = join[i].day;
    var settimana = 0;
    for (var k = 0; k < array.length; k++) {
      if (array[k].setHours(0) <= giorno_join.setHours(0)) settimana = settimana + 1;
    }
    const index_inizio = (settimana - 1) * 288 + (inizio.split(":")[0] * 12 + inizio.split(":")[1] / 5);
    const index_fine = (settimana - 1) * 288 + (fine.split(":")[0] * 12 + fine.split(":")[1] / 5);

    for (let j = index_inizio; j < index_fine; j++) {
      //console.log("     " + j);
      arrayFasce[j].valore += 1;
    }
    lock = true;
  }

  return arrayFasce;
}

function creaArrayPerGraficoAnno(join, codominio, media) {
  //Calcola quanti giorni sono presenti sull'asse y visibile
  const mesi = 12;
  const anno = codominio[0].getFullYear();
  console.log("----" + anno);
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
  console.log(arrayFasce);
  //Eliminare tutti i dati che hanno codominio fuori dal range
  join = join.filter((item) => item.day >= codominio[0] && item.day < codominio[1]);
  console.log(join);

  var numeroSettimanaPrecedente = 0;
  //Per ogni presenza in un certo intervallo orario aggiornare il valore di 1
  for (let i = 0; i < join.length; i++) {
    const inizio = join[i].inizio;
    const fine = join[i].fine;
    var lock = true;
    const mese = join[i].day.getMonth();
    var minimo = 100;
    var massimo = 0;
    var index = 0;

    const index_inizio = mese * 288 + (inizio.split(":")[0] * 12 + inizio.split(":")[1] / 5);
    const index_fine = mese * 288 + (fine.split(":")[0] * 12 + fine.split(":")[1] / 5);

    for (let j = index_inizio; j < index_fine; j++) {
      arrayFasce[j].valore += 1;
    }
    lock = true;
  }

  //Calcolo la media quando richiesto
  if (media === 2) {
    console.log(media);
    for (let i = 0; i < arrayFasce.length; i++) {
      arrayFasce[i].valore = arrayFasce[i].valore / 31;
    }
  }

  //Calcolo minimo
  var minimo = 100;
  var massimo = 0;
  var meseIndex = 0;
  var arrayAppoggio;
  if (media === 3)
    while (meseIndex < 12) {
      console.log(new Date(anno, meseIndex + 1, 0));
      arrayAppoggio = creaArrayPerGraficoMese(join, [getIntervalloMensile(new Date(anno, meseIndex, 1)).inizio, getIntervalloMensile(new Date(anno, meseIndex, 1)).fine]);
      var numeroSettimane = arrayAppoggio.length / 288;
      for (let j = 0; j < 288; j++) {
        for (let i = 0; i < numeroSettimane; i++) {
          if (minimo > arrayAppoggio[i * 288 + j].valore)
            minimo = arrayAppoggio[j + i * 288].valore
        }
        arrayFasce[meseIndex * 288 + j].valore = minimo;
        minimo = 100;
      }
      meseIndex = meseIndex + 1;
    }

  //Calcolo massimo
  if (media === 4)
    while (meseIndex < 12) {
      console.log(new Date(anno, meseIndex + 1, 0));
      arrayAppoggio = creaArrayPerGraficoMese(join, [getIntervalloMensile(new Date(anno, meseIndex, 1)).inizio, getIntervalloMensile(new Date(anno, meseIndex, 1)).fine]);
      var numeroSettimane = arrayAppoggio.length / 288;
      for (let j = 0; j < 288; j++) {
        for (let i = 0; i < numeroSettimane; i++) {
          if (massimo < arrayAppoggio[i * 288 + j].valore)
            massimo = arrayAppoggio[j + i * 288].valore
        }
        arrayFasce[meseIndex * 288 + j].valore = massimo;
        massimo = 0;
      }
      meseIndex = meseIndex + 1;
    }



  return arrayFasce;
}

export function data_formatting(db_fasce, db_calendario, codominio, tipologia, media) {
  console.log("STEP 1");
  if (tipologia === 1) return creaArrayPerGraficoSettimana(joinFasceOrariePresenze(db_calendario, creaArrayFascia(db_fasce)), codominio);
  if (tipologia === 2) return creaArrayPerGraficoMese(joinFasceOrariePresenze(db_calendario, creaArrayFascia(db_fasce)), codominio);
  if (tipologia === 3) return creaArrayPerGraficoAnno(joinFasceOrariePresenze(db_calendario, creaArrayFascia(db_fasce)), codominio, media);
}
