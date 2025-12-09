import * as d3 from 'd3';
import styles from "./Grafico.module.css";
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useEffect, useRef } from 'react';
import React from 'react';

function App2(){

  const [periodo, setPeriodo] = React.useState(0);
  const mySvgRef = useRef(null);

// set the dimensions and margins of the graph
const margin = {top: 80, right: 25, bottom: 30, left: 40},
  width = 1200 - margin.left - margin.right,
  height = 1200 - margin.top - margin.bottom;

// append the svg object to the body of the page
d3.select("#my_dataviz").selectAll("*").remove(); // Clear previous content
const svg = d3.select("#my_dataviz")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

//Read the data
d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/heatmap_data.csv").then(function(data) {

  // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
  const myGroups_old = Array.from(new Set(data.map(d => d.group)))
  const myVars_old = Array.from(new Set(data.map(d => d.variable)))
  var myGroups = [];
  var myVars = [];
  myVars = myVars_old;
  myGroups = myGroups_old;

  // Build X scales and axis:
  const x = d3.scaleBand()
    .range([ 0, width ])
    .domain(myGroups)
    .padding(0.05);
  svg.append("g")
    .style("font-size", 15)
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickSize(0))
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
    .domain([1,100])

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
    .data(data, function(d) {return d.group+':'+d.variable;})
    .join("rect")
      .attr("x", function(d) { return x(d.group) })
      .attr("y", function(d) { return y(d.variable) })
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", x.bandwidth() )
      .attr("height", y.bandwidth() )
      .style("fill", function(d) { return myColor(d.value)} )
      .style("stroke-width", 4)
      .style("stroke", "none")
      .style("opacity", 0.8)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
})

  useEffect(() => {
    // Questo codice verrà eseguito ogni volta che 'periodo' cambia
    console.log("Il periodo selezionato è:", periodo);
    // Qui puoi aggiungere la logica per aggiornare il grafico in base al periodo selezionato
  }, [periodo]);

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
            </Select> 
            <br/>
            <br/>      
            <svg width={1200} height={1200} id="my_dataviz" ref={mySvgRef}></svg>
        </div>
    )
}

export default App2;