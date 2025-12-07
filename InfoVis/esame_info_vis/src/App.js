import logo from './logo.svg';
import './App.css';
import * as d3 from 'd3';
import { useEffect } from 'react';

function App() {

  const drawGraph = () => {
      const data = {
        nodes: [
          { id: "A", group: 1 },
          { id: "B", group: 1 },
          { id: "C", group: 2 },
          { id: "D", group: 2 },
          { id: "E", group: 3 },
          { id: "F", group: 1 },
          { id: "G", group: 2 },
          { id: "H", group: 2 },
        ],
        links: [
          { source: "A", target: "B", value: 1 },
          { source: "A", target: "C", value: 2 },
          { source: "B", target: "D", value: 1 },
          { source: "C", target: "D", value: 3 },
          { source: "A", target: "C", value: 2 },
          { source: "B", target: "E", value: 1 },
          { source: "C", target: "F", value: 3 },
        ],
      };

      // Select the SVG element
      const svg = d3.select("#straight-line");
      var width = svg.attr("width");
      var height = svg.attr("height");

      width = parseInt(width);
      height = parseInt(height);
      width =
        document.getElementById("straight-line").width.baseVal.value *
        width *
        0.01;
      height =
        document.getElementById("straight-line").height.baseVal.value *
        height *
        0.01;
      console.log(width + " " + height);
      const color = d3.scaleOrdinal(d3.schemeCategory10);

      // Create simulation
      const simulation = d3
        .forceSimulation(data.nodes)
        .force(
          "link",
          d3.forceLink(data.links).id((d) => d.id)
        )
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

      // Draw links
      const link = svg
        .append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(data.links)
        .join("line")
        .attr("stroke-width", (d) => Math.sqrt(d.value));

      // Draw nodes
      const node = svg
        .append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(data.nodes)
        .join("circle")
        .attr("r", 10)
        .attr("fill", (d) => color(d.group))
        .call(
          d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

      node.append("title").text((d) => d.id);

      simulation.on("tick", () => {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      });

      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
  }

  const drawGraph2 = () => {
      const data = {
        nodes: [
          { id: "A", group: 1 },
          { id: "B", group: 1 },
          { id: "C", group: 2 },
          { id: "D", group: 2 },
          { id: "E", group: 3 },
          { id: "F", group: 1 },
          { id: "G", group: 2 },
          { id: "H", group: 2 },
        ],
        links: [
          { source: "A", target: "B", value: 1 },
          { source: "A", target: "C", value: 2 },
          { source: "B", target: "D", value: 1 },
          { source: "C", target: "D", value: 3 },
          { source: "A", target: "C", value: 2 },
          { source: "B", target: "E", value: 1 },
          { source: "C", target: "F", value: 3 },
        ],
      };

      // Select the SVG element
      const svg = d3.select("#no-straight-line");
      var width = svg.attr("width");
      var height = svg.attr("height");

      width = parseInt(width);
      height = parseInt(height);
      width =
        document.getElementById("no-straight-line").width.baseVal.value *
        width *
        0.01;
      height =
        document.getElementById("no-straight-line").height.baseVal.value *
        height *
        0.01;
      console.log(width + " " + height);
      const color = d3.scaleOrdinal(d3.schemeCategory10);

      // Create simulation
      const simulation = d3
        .forceSimulation(data.nodes)
        .force(
          "link",
          d3.forceLink(data.links).id((d) => d.id)
        )
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

      // Draw links
      const link = svg
        .append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(data.links)
        .join("line")
        .attr("stroke-width", (d) => Math.sqrt(d.value));

      // Draw nodes
      const node = svg
        .append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(data.nodes)
        .join("circle")
        .attr("r", 10)
        .attr("fill", (d) => color(d.group))
        .call(
          d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

      node.append("title").text((d) => d.id);

      simulation.on("tick", () => {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      });

      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
  }
  
  useEffect(() => {
    drawGraph();
    drawGraph2();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <h1>TENNIS TAVOLO 2.0</h1>
    <noscript><div w3-include-html="menu.html"></div></noscript>
    <h3 for="intervallo-temporale">Seleziona il periodo temporale</h3>
    <select name="intervallo-temporale" id="selettore periodo">
      <option value="">--Seleziona--</option>
      <option value="settimana">Settimana</option>
      <option value="mese">Mese</option>
      <option value="anno">Anno</option>
    </select>
    <br />
    <br />
    <br />
    <br />
    <div class="container">
      <div class="container-div">SPAZI LIBERI</div>
      <div class="container-div">ASSENZE</div>
      <div class="container-div">VARIAZIONI</div>
      <div class="container-div">PERCENTUALE RIEMPIMENTO</div>
    </div>

    <h2>ORGANIZZAZIONE SETTIMANALE</h2>
    <svg id="straight-line" width="90%" height="90vh"></svg>

    <br />
    <h2>ORGANIZZAZIONE SETTIMANALE</h2>
    <svg id="no-straight-line" width="90%" height="90vh"></svg>
    </div>
  );
}

export default App;
