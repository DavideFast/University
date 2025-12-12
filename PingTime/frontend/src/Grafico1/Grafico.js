import * as d3 from 'd3';
import styles from "./Grafico.module.css";
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useEffect} from 'react';
import React from 'react';
import * as dayjs from 'dayjs';
import  Slider from '@mui/material/Slider';





function calcola(valore){
  console.log("Valore slider: " + valore);
  if(valore<8)
    return 1/12;
  if(valore<16)
    return 1/6;
  if(valore<50)
    return 0.25;
  if(valore<75)
    return 0.50;
  if(valore<=100)
    return 1;
  return 1;
}

function d3_create_graphic( spostamento, finestraTemporale, data){
// set the dimensions and margins of the graph
  const margin = {top: 80, right: 25, bottom: 50, left: 120},
  width = 1800 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

// append the svg object to the body of the page
d3.select("#my_dataviz").selectAll("*").remove(); // Clear previous content
const svg = d3.select("#my_dataviz")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

//Read the data
  //console.log("https://mrkprojects.altervista.org/dataVis/api.php?table=pingtime_Persona&format=csv");
  //console.log("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/heatmap_data.csv");
  //console.log(data);
  var newData = new Array(data.length);
  //console.log(data[1].alias);

  for (let i = 0; i < data.length; i++) {
    newData[i] = {};
    newData[i].alias = data[i].alias;
    newData[i].ultima_azione = data[i].ultima_azione;
  }

  newData.sort((a, b) => {
    return d3.ascending(a.ultima_azione, b.ultima_azione);
  });

  var arrayFasce = new Array(7*96); //7 giorni x 24 ore x 4 quarti d'ora
  for(let i=0; i<7; i++){
    for(let j=0; j<96; j++){
    arrayFasce[i*96+j] = {};
    arrayFasce[i*96+j].valore = 0;

    if(j<10)
      if(j%4===0)
        arrayFasce[i*96+j].fascia = "0"+j+":00";
      else if(j%4===1)
        arrayFasce[i*96+j].fascia = "0"+j+":15";
      else if(j%4===2)
        arrayFasce[i*96+j].fascia = "0"+j+":30";
      else
        arrayFasce[i*96+j].fascia = "0"+j+":45";
    else
      if(j%4===0)
        arrayFasce[i*96+j].fascia = j+":00";
      else if(j%4===1)
        arrayFasce[i*96+j].fascia = j+":15";
      else if(j%4===2)  
        arrayFasce[i*96+j].fascia = j+":30";
      else
      arrayFasce[i*96+j].fascia = j+":45";

    if(i===0) arrayFasce[i*96+j].giorno = "Domenica";
    if(i===1) arrayFasce[i*96+j].giorno = "Lunedì";
    if(i===2) arrayFasce[i*96+j].giorno = "Martedì";
    if(i===3) arrayFasce[i*96+j].giorno = "Mercoledì";
    if(i===4) arrayFasce[i*96+j].giorno = "Giovedì";
    if(i===5) arrayFasce[i*96+j].giorno = "Venerdì";
    if(i===6) arrayFasce[i*96+j].giorno = "Sabato";
  }
}
  //Creare array sulla base della fascia 
  for (let i = 0; i < newData.length; i++) {
      if(dayjs(newData[i].ultima_azione).day()===0){
        arrayFasce[0].valore +=1;
      }
      if(dayjs(newData[i].ultima_azione).day()===1){
        arrayFasce[1].valore +=1;
      }
      if(dayjs(newData[i].ultima_azione).day()===2){
        arrayFasce[2].valore +=1;
      }
      if(dayjs(newData[i].ultima_azione).day()===3){
        arrayFasce[3].valore +=1;
      }
      if(dayjs(newData[i].ultima_azione).day()===4){
        arrayFasce[4].valore +=1;
      }
      if(dayjs(newData[i].ultima_azione).day()===5){
        arrayFasce[5].valore +=1;
      }
      if(dayjs(newData[i].ultima_azione).day()===6){
        arrayFasce[6].valore +=1;
      }
    } 
  
  //console.log(arrayFasce);

  // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
  var myGroups = new Array(24);
  for(let i=0; i<96; i++){
    if(i<10)
      if(i%4===0)
        myGroups[i] = "0"+i+":00";
      else if(i%4===1)
        myGroups[i] = "0"+i+":15";
      else if(i%4===2)
        myGroups[i] = "0"+i+":30";
      else
        myGroups[i] = "0"+i+":45";
    else
      if(i%4===0)
        myGroups[i] = i+":00";
      else if(i%4===1)
        myGroups[i] = i+":15";
      else if(i%4===2)  
        myGroups[i] = i+":30";
      else
      myGroups[i] = i+":45";
  }
  var myVars = [];
  myVars = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];

  // Build X scales and axis:
    var xAxis = d3.axisBottom();
    //console.log(Date.now() + 28*60*60*1000- (28-22*spostamento)*60*60*1000);
    //console.log(Date.now());
    var x = d3.scaleTime();
    x.domain([(new Date(2000,0,1)).setHours(finestraTemporale-4), (new Date(2000,0,1)).setHours(finestraTemporale)]);
    //.domain([Date.now() + 28*60*60*1000- (28-22*spostamento)*60*60*1000, Date.now() + 2 * 60 * 60 * 1000+(22*spostamento)*60*60*1000])
    x.range([ 0, width ]);
    xAxis.scale(x);
    xAxis.ticks(d3.timeMinute.every(60*spostamento));
    //xAxis.ticks(50);
    //xAxis.tickValues(x.ticks().filter(function(d,i){ return !(i%4)}));
    xAxis.tickFormat(d3.timeFormat("%H:%M"));

  svg.append("g")
    .style("font-size", 12)
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis/*.tickSize(0)*/)
    .select(".domain").remove()

  // Build Y scales and axis:
  const y = d3.scaleBand()
    .range([ height, 0 ])
    .domain(myVars)
    .padding(0.05);
  svg.append("g")
    .style("font-size", 15)
    .call(d3.axisLeft(y).tickSize(0))
    .select(".domain").remove()

  // Build color scale
  const myColor = d3.scaleSequential()
    .interpolator(d3.interpolateInferno)
    .domain([0,100])

  // create a tooltip
  const tooltip = d3.select("#my_dataviz")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = function(event,d) {
    tooltip
      .style("opacity", 1)
    d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1)
  }
  const mousemove = function(event,d) {
    tooltip
      .html("The exact value of<br>this cell is: " + d.value)
      .style("left", (event.x)/2 + "px")
      .style("top", (event.y)/2 + "px")
  }
  const mouseleave = function(event,d) {
    tooltip
      .style("opacity", 0)
    d3.select(this)
      .style("stroke", "none")
      .style("opacity", 0.8)
  }

  // add the squares
  svg.selectAll()
    .data(arrayFasce, function(d) {return d.giorno+':'+d.valore;})
    .join("rect")
      .attr("x", function(d) { return x(d.fascia) })
      .attr("y", function(d) { return y(d.giorno) })
      .attr("rx", 4)
      .attr("ry", 4)
      //.attr("width", x.bandwidth() )
      .attr("height", y.bandwidth() )
      .style("fill", function(d) { return myColor(d.valore)} )
      .style("stroke-width", 4)
      .style("stroke", "none")
      .style("opacity", 0.8)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)

}

function setFinestraTemporale(valore){
  return valore * 0.2 + 4;
}

function App2(){

  const [periodo, setPeriodo] = React.useState(0);
  const [spostamento, setSpostamento] = React.useState(1);
  const [spostamentoSlider, setSpostamentoSlider] = React.useState(100);
  const [spostamentoCopia, setSpostamentoCopia] = React.useState(0);
  const [valore, setValore] = React.useState(0);
  const [lock, setLock] = React.useState(false);
  const [previousX, setPreviousX] = React.useState(0);
  const [finestraTemporale, setFinestraTemporale] = React.useState(4); //4 ore
  const [dati_acquisiti, setDatiAcquisiti] = React.useState([]);




  useEffect(() => {

      const mouseDrag = (e) => {
      console.log("SONO IN MOUSE DRAG");
      if(lock){
        console.log("ATTIVO: "+lock);
        if(spostamentoCopia + e.clientX - previousX <= 960  && spostamentoCopia + e.clientX - previousX >= 0)
          setSpostamentoCopia(spostamentoCopia + e.clientX - previousX);
        console.log("Spostamento copia: " + spostamentoCopia);
      }
      }

      const mouseUp = (e) => {
      setLock(false);
      console.log("SONO IN MOUSE UP");
      }

  document.addEventListener('mousemove', mouseDrag);
  return function cleanup() {
      document.removeEventListener('mousemove', mouseDrag);
    };

    
    //document.addEventListener('mouseup', mouseDrag);


    if(dati_acquisiti.length!==null){
      d3.csv("https://mrkprojects.altervista.org/dataVis/api.php?table=pingtime_Calendario&format=csv").then(function(data) {
        setDatiAcquisiti(data);
        d3_create_graphic(spostamento,finestraTemporale,data);
      });
    }
    else{
      d3_create_graphic(spostamento,finestraTemporale,dati_acquisiti);
    }
    console.log("SONO IN USE EFFECT");
  }, [periodo,spostamento,lock]);

    return (

        <div className={styles.container}>
            <br/>
            <br/>
            <h2> ORGANIZZAZIONE/... </h2>
            <br/>
            <br/>
            <Select sx={{minWidth:"150px"}}
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={periodo}
              label="Age"
              onChange={(event)=>setPeriodo(event.target.value)}
            >
              <MenuItem value={0}><em>None</em></MenuItem>
              <MenuItem value={10}>Settimana</MenuItem>
              <MenuItem value={20}>Mese</MenuItem>
              <MenuItem value={30}>Anno</MenuItem>
              <MenuItem value={40}>Anno2</MenuItem>
            </Select> 
            <br/>
            <br/>      
            <svg width={1800} height={600} id="my_dataviz" ></svg>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            
            <div className={styles.barra} >
              <div className={styles.maniglie}  
                onMouseDown={(event)=>{setPreviousX(event.clientX);setLock(true)}}
                onClick={()=>{setLock(false)}}
                onMouseUp={(event)=>{console.log("HAHAHAHAHAH");setLock(false)}}

                style={{backgroundColor:"green",
                        marginLeft: `${spostamentoCopia}px`,
                        boxShadow: `0 0 0 ${valore}px rgba(76, 175, 80, 0.4)`
                        }} 
              />
              <br/>
              <br/>
              <Slider aria-label="Volume" value={spostamentoSlider} onMouseUp={()=>setSpostamento(calcola(spostamentoSlider))} onChange={(event)=>{setSpostamentoSlider(event.target.value)}} />
            </div>
            
        </div>
    )
}

export default App2;