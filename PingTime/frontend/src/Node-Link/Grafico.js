import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as d3 from "d3";
import styles from "./Grafico.module.css";

/**
 * Componente principale per la visualizzazione del grafo sociale.
 * Permette di esplorare le connessioni tra persone che hanno giocato insieme,
 * con diverse viste (circolare, cluster, matchmaker) e filtri interattivi.
 */
function GraphVisualization() {
  // === REFS ===
  // Riferimento all'elemento SVG per il rendering D3
  const svgRef = useRef();
  // Riferimento al tooltip per mostrare informazioni al hover
  const tooltipRef = useRef();

  // === STATE PRINCIPALE ===
  // Settimana corrente visualizzata (dati caricati dinamicamente)
  const [settimana, setSettimana] = useState(40);
  // Dati JSON caricati dal server
  const [data, setData] = useState(null);
  // Modalità di visualizzazione: 'circular', 'clusters', 'matchmaker'
  const [viewMode, setViewMode] = useState("circular");
  // Cluster selezionato (quando si espande un cluster nella vista clusters)
  const [selectedCluster, setSelectedCluster] = useState(null);
  // Flag di caricamento
  const [loading, setLoading] = useState(true);

  // === STATE PER SELEZIONE NODO E FILTRI ===
  // Nodo attualmente selezionato/focalizzato
  const [focusedNode, setFocusedNode] = useState(null);
  // Filtro per peso minimo delle connessioni
  const [minWeight, setMinWeight] = useState(1);
  // Filtro per mostrare solo le top N connessioni (0 = tutte)
  const [topN, setTopN] = useState(0);
  // Modalità di filtro attiva: 'weight' (peso minimo) o 'topN' (top N connessioni)
  const [filterMode, setFilterMode] = useState("weight");

  // === STATE PER MATCHMAKER ===
  // Modalità matchmaker: 'manual' (selezione utente) o 'auto' (algoritmo automatico)
  const [matchmakerMode, setMatchmakerMode] = useState("manual");
  // Coppie già formate nel matchmaker
  const [selectedPairs, setSelectedPairs] = useState([]);
  // Set di nodi già utilizzati in coppie (non più disponibili)
  const [usedNodes, setUsedNodes] = useState(new Set());
  // Primo nodo selezionato per formare una coppia
  const [firstSelection, setFirstSelection] = useState(null);

  // === COSTANTI ===
  // Settimane disponibili per la selezione
  const settimane = [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];
  // Scala colori per i cluster (palette Tableau10)
  const clusterColors = d3.scaleOrdinal(d3.schemeTableau10);

  // === EFFECTS ===

  /**
   * Reset dello state quando cambia la settimana.
   * Pulisce selezioni, filtri e coppie del matchmaker.
   */
  useEffect(() => {
    setSelectedPairs([]);
    setUsedNodes(new Set());
    setFirstSelection(null);
    setFocusedNode(null);
    setMinWeight(1);
    setTopN(0);
  }, [settimana]);

  /**
   * Reset del nodo focalizzato quando cambia la modalità di visualizzazione.
   */
  useEffect(() => {
    setFocusedNode(null);
    setMinWeight(1);
    setTopN(0);
  }, [viewMode]);

  /**
   * Caricamento dati JSON per la settimana selezionata.
   * I file sono in /public/data/analysis_settimana_XX.json
   */
  useEffect(() => {
    setLoading(true);
    d3.json(`/data/analysis_settimana_${settimana}.json`)
      .then((jsonData) => {
        setData(jsonData);
        setSelectedCluster(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Errore caricamento JSON:", err);
        setLoading(false);
      });
  }, [settimana]);

  // === VALORI CALCOLATI (MEMOIZED) ===

  /**
   * Calcola informazioni sul nodo focalizzato:
   * - maxWeight: peso massimo delle sue connessioni
   * - connectionCount: numero totale di connessioni
   */
  const focusedNodeInfo = useMemo(() => {
    if (!focusedNode || !data) return { maxWeight: 1, connectionCount: 0 };
    const links = data.clusters.links;
    const nodeLinks = links.filter((l) => l.source === focusedNode.id || l.target === focusedNode.id);
    return {
      maxWeight: d3.max(nodeLinks, (l) => l.weight) || 1,
      connectionCount: nodeLinks.length,
    };
  }, [focusedNode, data]);

  /**
   * Mappa che associa ogni nodo ai suoi "candidati" per il matchmaker.
   * Un candidato è un nodo con cui NON ha mai giocato (anti-edge).
   */
  const candidatesMap = useMemo(() => {
    if (!data) return new Map();

    const antiedges = data.antimatching.antiedges || [];
    const map = new Map();

    // Inizializza un Set vuoto per ogni nodo
    data.clusters.nodes.forEach((n) => {
      map.set(n.id, new Set());
    });

    // Popola con gli anti-edge (coppie che non hanno mai giocato insieme)
    antiedges.forEach((e) => {
      if (map.has(e.source)) map.get(e.source).add(e.target);
      if (map.has(e.target)) map.get(e.target).add(e.source);
    });

    return map;
  }, [data]);

  /**
   * Candidati disponibili per il nodo attualmente selezionato nel matchmaker.
   * Esclude i nodi già usati in altre coppie.
   */
  const availableCandidates = useMemo(() => {
    if (!firstSelection || !candidatesMap.has(firstSelection.id)) return new Set();

    const candidates = candidatesMap.get(firstSelection.id);
    const available = new Set();
    candidates.forEach((id) => {
      if (!usedNodes.has(id)) {
        available.add(id);
      }
    });
    return available;
  }, [firstSelection, candidatesMap, usedNodes]);

  // === CALLBACKS ===

  /**
   * Applica l'antimatching automatico calcolato dal server.
   * Usa l'algoritmo di maximum matching sul grafo complementare.
   */
  const applyAutoMatching = useCallback(() => {
    if (!data) return;

    const autoPairs = data.antimatching.suggestedPairs || [];
    const pairs = autoPairs.map((p) => ({
      source: p.source,
      target: p.target,
      sourceLabel: p.sourceLabel,
      targetLabel: p.targetLabel,
    }));

    // Marca tutti i nodi delle coppie come "usati"
    const used = new Set();
    pairs.forEach((p) => {
      used.add(p.source);
      used.add(p.target);
    });

    setSelectedPairs(pairs);
    setUsedNodes(used);
    setFirstSelection(null);
  }, [data]);

  /**
   * Gestisce il click su un nodo nel matchmaker manuale.
   * - Se nessun nodo è selezionato: seleziona questo nodo
   * - Se lo stesso nodo è selezionato: deseleziona
   * - Se è un candidato valido: forma la coppia
   */
  const handleMatchmakerClick = useCallback(
    (node) => {
      // In modalità auto, ignora i click
      if (matchmakerMode === "auto") return;
      // Se il nodo è già usato in una coppia, ignora
      if (usedNodes.has(node.id)) return;

      if (!firstSelection) {
        // Prima selezione: memorizza il nodo
        setFirstSelection(node);
      } else if (firstSelection.id === node.id) {
        // Click sullo stesso nodo: deseleziona
        setFirstSelection(null);
      } else if (availableCandidates.has(node.id)) {
        // Click su un candidato valido: forma la coppia
        const newPair = {
          source: firstSelection.id,
          target: node.id,
          sourceLabel: firstSelection.label,
          targetLabel: node.label,
        };
        setSelectedPairs([...selectedPairs, newPair]);
        setUsedNodes(new Set([...usedNodes, firstSelection.id, node.id]));
        setFirstSelection(null);
      }
      // Se il nodo non è un candidato valido, non fare nulla
    },
    [matchmakerMode, firstSelection, availableCandidates, selectedPairs, usedNodes]
  );

  /**
   * Rimuove una coppia dal matchmaker.
   * Libera i nodi per essere usati in altre coppie.
   */
  const removePair = useCallback(
    (index) => {
      const newPairs = [...selectedPairs];
      newPairs.splice(index, 1);
      setSelectedPairs(newPairs);

      // Ricalcola i nodi usati
      const newUsed = new Set();
      newPairs.forEach((p) => {
        newUsed.add(p.source);
        newUsed.add(p.target);
      });
      setUsedNodes(newUsed);
    },
    [selectedPairs]
  );

  /**
   * Reset completo del matchmaker.
   */
  const resetSelection = useCallback(() => {
    setSelectedPairs([]);
    setUsedNodes(new Set());
    setFirstSelection(null);
  }, []);

  /**
   * Mostra il tooltip in una posizione specifica con il contenuto HTML.
   */
  const showTooltip = useCallback((event, content) => {
    const tooltip = d3.select(tooltipRef.current);
    tooltip
      .style("opacity", 1)
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 10 + "px")
      .html(content);
  }, []);

  /**
   * Nasconde il tooltip.
   */
  const hideTooltip = useCallback(() => {
    d3.select(tooltipRef.current).style("opacity", 0);
  }, []);

  /**
   * Renderizza la vista aggregata dei cluster.
   * Mostra ogni cluster come un cerchio, cliccabile per espanderlo.
   */
  const renderClusterView = useCallback(
    (g, width, height) => {
      if (!data) return;

      const clusters = data.clusters.clusters;
      const interClusterLinks = data.interCluster.clusterConnections;
      const radius = Math.min(width, height) / 2 - 80;
      const angleStep = (2 * Math.PI) / clusters.length;

      // Posiziona i cluster in cerchio
      clusters.forEach((cluster, i) => {
        cluster.x = radius * 0.6 * Math.cos(angleStep * i - Math.PI / 2);
        cluster.y = radius * 0.6 * Math.sin(angleStep * i - Math.PI / 2);
      });

      const maxWeight = d3.max(interClusterLinks, (d) => d.totalWeight) || 1;

      // Disegna gli archi inter-cluster (inizialmente nascosti)
      const linkGroup = g.append("g").attr("class", "cluster-links");
      linkGroup
        .selectAll("line")
        .data(interClusterLinks)
        .join("line")
        .attr("x1", (d) => clusters[d.from]?.x || 0)
        .attr("y1", (d) => clusters[d.from]?.y || 0)
        .attr("x2", (d) => clusters[d.to]?.x || 0)
        .attr("y2", (d) => clusters[d.to]?.y || 0)
        .attr("stroke", "#999")
        .attr("stroke-width", (d) => 2 + (d.totalWeight / maxWeight) * 4)
        .attr("stroke-opacity", 0);

      // Scala per la dimensione dei cluster in base al numero di membri
      const maxSize = d3.max(clusters, (d) => d.size) || 1;
      const sizeScale = d3.scaleSqrt().domain([1, maxSize]).range([30, 70]);

      // Disegna i nodi cluster
      const clusterNodes = g
        .append("g")
        .selectAll("g")
        .data(clusters)
        .join("g")
        .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
        .style("cursor", "pointer")
        .on("click", (event, d) => setSelectedCluster(d.id))
        .on("mouseover", function (event, d) {
          // Mostra archi connessi a questo cluster
          linkGroup.selectAll("line").attr("stroke-opacity", (link) => (link.from === d.id || link.to === d.id ? 0.6 : 0));

          showTooltip(
            event,
            `
                    <strong>Cluster ${d.id}</strong><br/>
                    Persone: ${d.size}<br/>
                    <em>Click per espandere</em>
                `
          );
        })
        .on("mouseout", function () {
          linkGroup.selectAll("line").attr("stroke-opacity", 0);
          hideTooltip();
        });

      // Cerchio del cluster
      clusterNodes
        .append("circle")
        .attr("r", (d) => sizeScale(d.size))
        .attr("fill", (d) => clusterColors(d.id))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

      // Etichetta con il numero di membri
      clusterNodes
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "#fff")
        .text((d) => d.size);
    },
    [data, showTooltip, hideTooltip, clusterColors]
  );

  /**
   * Effect principale per il rendering del grafo.
   * Gestisce tutte le viste: circolare, cluster espanso, matchmaker.
   */
  useEffect(() => {
    if (!data || loading) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;
    const margin = 50;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Gruppo principale centrato
    const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

    // === VISTA CLUSTER AGGREGATA ===
    if (viewMode === "clusters") {
      if (selectedCluster === null) {
        renderClusterView(g, width, height);
        return;
      }
    }

    // === PREPARAZIONE DATI PER VISTA CIRCOLARE ===
    let nodes = [...data.clusters.nodes];
    let links = [...data.clusters.links];

    // Se siamo in un cluster espanso, filtra solo i nodi di quel cluster
    if (viewMode === "clusters" && selectedCluster !== null) {
      nodes = data.clusters.nodes.filter((n) => n.cluster === selectedCluster);
      const nodeIds = new Set(nodes.map((n) => n.id));
      links = data.clusters.links.filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target));
    }

    if (!nodes || nodes.length === 0) return;

    // === ORDINAMENTO NODI CON INTERLEAVING ===
    // L'interleaving alterna nodi di cluster diversi nel cerchio,
    // così gli archi intra-cluster attraversano il cerchio e sono più visibili

    // Raggruppa nodi per cluster
    const clusterGroups = new Map();
    nodes.forEach((n) => {
      if (!clusterGroups.has(n.cluster)) clusterGroups.set(n.cluster, []);
      clusterGroups.get(n.cluster).push(n);
    });

    // Ordina ogni cluster per grado (nodi più connessi prima)
    clusterGroups.forEach((group) => group.sort((a, b) => b.degree - a.degree));

    // Interleave: prendi un nodo per cluster a rotazione
    const sortedNodes = [];
    const clusterArrays = [...clusterGroups.values()];
    let maxLen = Math.max(...clusterArrays.map((a) => a.length));

    for (let i = 0; i < maxLen; i++) {
      for (let c = 0; c < clusterArrays.length; c++) {
        if (i < clusterArrays[c].length) {
          sortedNodes.push(clusterArrays[c][i]);
        }
      }
    }

    nodes = sortedNodes;

    // === LAYOUT CIRCOLARE ===
    const radius = Math.min(width, height) / 2 - margin;
    const angleStep = (2 * Math.PI) / nodes.length;

    // Posiziona ogni nodo sul cerchio
    nodes.forEach((node, i) => {
      node.x = radius * Math.cos(angleStep * i - Math.PI / 2);
      node.y = radius * Math.sin(angleStep * i - Math.PI / 2);
    });

    // Mappa per lookup veloce dei nodi per ID
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Scale per lo spessore degli archi in base al peso
    const maxWeight = d3.max(links, (d) => d.weight) || 1;
    const linkWidthScale = d3.scaleLinear().domain([1, maxWeight]).range([1, 4]);

    // === CALCOLO TOP N CONNESSIONI ===
    // Se il filtro è attivo, calcola quali connessioni mostrare
    let topNIds = new Set();
    if (focusedNode && filterMode === "topN" && topN > 0) {
      const nodeLinks = links
        .filter((l) => l.source === focusedNode.id || l.target === focusedNode.id)
        .map((l) => ({
          ...l,
          otherId: l.source === focusedNode.id ? l.target : l.source,
        }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, topN);
      topNIds = new Set(nodeLinks.map((l) => l.otherId));
    }

    // === RENDERING ARCHI ===
    const linkGroup = g.append("g").attr("class", "links");

    linkGroup
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("x1", (d) => nodeMap.get(d.source)?.x || 0)
      .attr("y1", (d) => nodeMap.get(d.source)?.y || 0)
      .attr("x2", (d) => nodeMap.get(d.target)?.x || 0)
      .attr("y2", (d) => nodeMap.get(d.target)?.y || 0)
      // Colore: rosso per top N, blu per gli altri
      .attr("stroke", (d) => {
        if (!focusedNode) return "#3498db";
        const isConnected = d.source === focusedNode.id || d.target === focusedNode.id;
        if (!isConnected) return "#3498db";

        if (filterMode === "topN" && topN > 0) {
          const otherId = d.source === focusedNode.id ? d.target : d.source;
          return topNIds.has(otherId) ? "#e74c3c" : "#3498db";
        }
        return "#3498db";
      })
      // Spessore: più spesso per top N
      .attr("stroke-width", (d) => {
        if (!focusedNode) return linkWidthScale(d.weight || 1);
        const isConnected = d.source === focusedNode.id || d.target === focusedNode.id;
        if (!isConnected) return linkWidthScale(d.weight || 1);

        if (filterMode === "topN" && topN > 0) {
          const otherId = d.source === focusedNode.id ? d.target : d.source;
          return topNIds.has(otherId) ? 4 : linkWidthScale(d.weight || 1);
        }
        return linkWidthScale(d.weight || 1);
      })
      // Opacità: visibile solo per connessioni del nodo selezionato che passano il filtro
      .attr("stroke-opacity", (d) => {
        if (focusedNode) {
          const isConnected = d.source === focusedNode.id || d.target === focusedNode.id;
          if (!isConnected) return 0;

          if (filterMode === "weight") {
            // Filtro peso minimo
            return d.weight >= minWeight ? 0.8 : 0;
          } else if (filterMode === "topN" && topN > 0) {
            // Filtro top N: evidenzia top N, attenua gli altri
            const otherId = d.source === focusedNode.id ? d.target : d.source;
            return topNIds.has(otherId) ? 0.8 : 0.15;
          }
          return 0.8;
        }
        return 0; // Nascosti di default
      });

    // === ARCHI MATCHMAKER: CANDIDATI ===
    // Nel matchmaker manuale, mostra linee tratteggiate verso i candidati
    if (viewMode === "matchmaker" && matchmakerMode === "manual" && firstSelection && nodeMap.has(firstSelection.id)) {
      const sourceNode = nodeMap.get(firstSelection.id);
      const candidateLines = g.append("g").attr("class", "candidate-lines");

      availableCandidates.forEach((candidateId) => {
        const targetNode = nodeMap.get(candidateId);
        if (targetNode) {
          candidateLines
            .append("line")
            .attr("x1", sourceNode.x)
            .attr("y1", sourceNode.y)
            .attr("x2", targetNode.x)
            .attr("y2", targetNode.y)
            .attr("stroke", "#27ae60")
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 0.6)
            .attr("stroke-dasharray", "5,3"); // Linea tratteggiata
        }
      });
    }

    // === ARCHI MATCHMAKER: COPPIE FORMATE ===
    // Mostra linee solide per le coppie già formate
    if (viewMode === "matchmaker" && selectedPairs.length > 0) {
      const pairLines = g.append("g").attr("class", "pair-lines");

      selectedPairs.forEach((pair) => {
        const sourceNode = nodeMap.get(pair.source);
        const targetNode = nodeMap.get(pair.target);
        if (sourceNode && targetNode) {
          pairLines
            .append("line")
            .attr("x1", sourceNode.x)
            .attr("y1", sourceNode.y)
            .attr("x2", targetNode.x)
            .attr("y2", targetNode.y)
            .attr("stroke", "#27ae60")
            .attr("stroke-width", 3)
            .attr("stroke-opacity", 0.9);
        }
      });
    }

    // === RENDERING NODI ===
    const nodeGroup = g.append("g").attr("class", "nodes");
    const maxDegree = d3.max(nodes, (d) => d.degree) || 1;
    // Scala per la dimensione dei nodi in base al grado
    const nodeSizeScale = d3.scaleSqrt().domain([1, maxDegree]).range([5, 16]);
    // Gruppo per le etichette
    const labelGroup = g.append("g").attr("class", "labels");

    // === ETICHETTE PERMANENTI ===
    // Mostra etichetta per il nodo focalizzato e le sue top N connessioni
    if (focusedNode && nodeMap.has(focusedNode.id)) {
      const fn = nodeMap.get(focusedNode.id);
      // Etichetta del nodo selezionato
      labelGroup
        .append("text")
        .attr("x", fn.x)
        .attr("y", fn.y - nodeSizeScale(fn.degree) * 1.5 - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "#e74c3c")
        .text(fn.label);

      // Etichette per le top N connessioni con ranking e peso
      if (filterMode === "topN" && topN > 0) {
        const nodeLinks = links
          .filter((l) => l.source === focusedNode.id || l.target === focusedNode.id)
          .map((l) => ({
            ...l,
            otherId: l.source === focusedNode.id ? l.target : l.source,
          }))
          .sort((a, b) => b.weight - a.weight)
          .slice(0, topN);

        nodeLinks.forEach((link, idx) => {
          const otherNode = nodeMap.get(link.otherId);
          if (otherNode) {
            labelGroup
              .append("text")
              .attr("x", otherNode.x)
              .attr("y", otherNode.y - nodeSizeScale(otherNode.degree) - 5)
              .attr("text-anchor", "middle")
              .attr("font-size", "10px")
              .attr("font-weight", "bold")
              .attr("fill", "#e74c3c")
              .text(`#${idx + 1} (${link.weight})`);
          }
        });
      }
    }

    // === CERCHI DEI NODI ===
    nodeGroup
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      // Raggio: più grande per nodi selezionati/evidenziati
      .attr("r", (d) => {
        if (viewMode === "matchmaker" && matchmakerMode === "manual") {
          if (firstSelection && firstSelection.id === d.id) return nodeSizeScale(d.degree) * 1.5;
          if (availableCandidates.has(d.id)) return nodeSizeScale(d.degree) * 1.3;
        }
        if (focusedNode && focusedNode.id === d.id) return nodeSizeScale(d.degree) * 1.5;
        return nodeSizeScale(d.degree);
      })
      // Colore di riempimento in base allo stato
      .attr("fill", (d) => {
        if (viewMode === "matchmaker") {
          if (usedNodes.has(d.id)) return "#95a5a6"; // Grigio: già usato
          if (matchmakerMode === "manual") {
            if (firstSelection && firstSelection.id === d.id) return "#e74c3c"; // Rosso: selezionato
            if (availableCandidates.has(d.id)) return "#27ae60"; // Verde: candidato
            if (firstSelection) return "#bdc3c7"; // Grigio chiaro: non compatibile
          }
          return "#3498db"; // Blu: disponibile
        }
        if (focusedNode && focusedNode.id === d.id) return "#e74c3c";
        if (focusedNode && filterMode === "topN" && topN > 0 && topNIds.has(d.id)) return "#e74c3c";
        return clusterColors(d.cluster); // Colore del cluster
      })
      // Colore del bordo
      .attr("stroke", (d) => {
        if (viewMode === "matchmaker" && matchmakerMode === "manual") {
          if (firstSelection && firstSelection.id === d.id) return "#c0392b";
          if (availableCandidates.has(d.id)) return "#1e8449";
        }
        if (focusedNode && focusedNode.id === d.id) return "#c0392b";
        if (focusedNode && filterMode === "topN" && topN > 0 && topNIds.has(d.id)) return "#c0392b";
        return "#fff";
      })
      // Spessore del bordo
      .attr("stroke-width", (d) => {
        if (viewMode === "matchmaker" && matchmakerMode === "manual") {
          if (firstSelection && firstSelection.id === d.id) return 4;
          if (availableCandidates.has(d.id)) return 3;
        }
        if (focusedNode && focusedNode.id === d.id) return 4;
        if (focusedNode && filterMode === "topN" && topN > 0 && topNIds.has(d.id)) return 3;
        return 1.5;
      })
      .style("cursor", "pointer")
      // === CLICK SUI NODI ===
      .on("click", (event, d) => {
        event.stopPropagation(); // Previene il click sullo sfondo
        if (viewMode === "matchmaker") {
          handleMatchmakerClick(d);
        } else if (viewMode === "circular" || (viewMode === "clusters" && selectedCluster !== null)) {
          // Toggle selezione nodo
          if (focusedNode && focusedNode.id === d.id) {
            // Deseleziona
            setFocusedNode(null);
            setMinWeight(1);
            setTopN(0);
          } else {
            // Seleziona con filtro top 3 di default
            setFocusedNode(d);
            setMinWeight(1);
            setTopN(3);
            setFilterMode("topN");
          }
        }
      })
      // === HOVER SUI NODI ===
      .on("mouseover", function (event, d) {
        // Se non c'è un nodo selezionato, mostra archi al hover
        if (!focusedNode && viewMode !== "matchmaker") {
          linkGroup.selectAll("line").attr("stroke-opacity", (l) => (l.source === d.id || l.target === d.id ? 0.8 : 0));
        }

        // Ingrandisci il nodo
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", nodeSizeScale(d.degree) * 1.5);

        // Mostra etichetta temporanea
        if (!focusedNode || focusedNode.id !== d.id) {
          labelGroup
            .append("text")
            .attr("class", "hover-label")
            .attr("x", d.x)
            .attr("y", d.y - nodeSizeScale(d.degree) * 1.5 - 8)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "#333")
            .text(d.label);
        }

        // Costruisci contenuto tooltip
        let tooltipContent = `<strong>${d.label}</strong><br/>`;
        tooltipContent += `Cluster: ${d.cluster}<br/>`;
        tooltipContent += `Connessioni: ${d.degree}`;

        if (viewMode === "circular" || (viewMode === "clusters" && selectedCluster !== null)) {
          tooltipContent += "<br/><em>Click per selezionare</em>";
        }

        // Tooltip specifico per matchmaker
        if (viewMode === "matchmaker" && matchmakerMode === "manual") {
          if (usedNodes.has(d.id)) {
            tooltipContent = `<strong>${d.label}</strong><br/><span style="color:#95a5a6">✓ Già accoppiato</span>`;
          } else if (firstSelection && firstSelection.id === d.id) {
            tooltipContent = `<strong>${d.label}</strong><br/><span style="color:#e74c3c">Selezionato</span><br/>${availableCandidates.size} candidati`;
          } else if (availableCandidates.has(d.id)) {
            tooltipContent = `<strong>${d.label}</strong><br/><span style="color:#27ae60">✓ Candidato</span><br/><em>Click per formare coppia</em>`;
          } else if (firstSelection) {
            tooltipContent = `<strong>${d.label}</strong><br/><span style="color:#bdc3c7">✗ Non compatibile</span>`;
          } else {
            const availableCount = [...(candidatesMap.get(d.id) || [])].filter((id) => !usedNodes.has(id)).length;
            tooltipContent = `<strong>${d.label}</strong><br/>${availableCount} candidati<br/><em>Click per selezionare</em>`;
          }
        }

        showTooltip(event, tooltipContent);
      })
      // === MOUSEOUT SUI NODI ===
      .on("mouseout", function (event, d) {
        // Ripristina dimensione originale
        const baseR = nodeSizeScale(d.degree);
        let targetR = baseR;
        if (focusedNode && focusedNode.id === d.id) targetR = baseR * 1.5;
        if (viewMode === "matchmaker" && matchmakerMode === "manual") {
          if (firstSelection && firstSelection.id === d.id) targetR = baseR * 1.5;
          else if (availableCandidates.has(d.id)) targetR = baseR * 1.3;
        }

        d3.select(this).transition().duration(150).attr("r", targetR);

        // Rimuovi etichetta hover
        labelGroup.selectAll(".hover-label").remove();

        // Nascondi archi se non c'è nodo selezionato
        if (!focusedNode && viewMode !== "matchmaker") {
          linkGroup.selectAll("line").attr("stroke-opacity", 0);
        }

        hideTooltip();
      });

    // === CLICK SULLO SFONDO ===
    // Deseleziona il nodo focalizzato
    svg.on("click", () => {
      if (focusedNode) {
        setFocusedNode(null);
        setMinWeight(1);
        setTopN(0);
      }
    });
  }, [
    data,
    viewMode,
    selectedCluster,
    loading,
    focusedNode,
    minWeight,
    topN,
    filterMode,
    showTooltip,
    hideTooltip,
    clusterColors,
    renderClusterView,
    selectedPairs,
    usedNodes,
    firstSelection,
    availableCandidates,
    handleMatchmakerClick,
    candidatesMap,
    matchmakerMode,
  ]);

  // === RENDERING CONDIZIONALE ===
  if (loading) {
    return (
      <div className={styles.container}>
        <p>Caricamento...</p>
      </div>
    );
  }

  // === JSX PRINCIPALE ===
  return (
    <div className={styles.container}>
      {/* === TITOLO COMPONENTE === */}
      <h1 className={styles.title}>Rete di Coallenamento</h1>

      {/* === BARRA CONTROLLI === */}
      <div className={styles.controls}>
        {/* Selettore settimana */}
        <div className={styles.controlGroup}>
          <label>Settimana:</label>
          <select value={settimana} onChange={(e) => setSettimana(Number(e.target.value))} className={styles.select}>
            {settimane.map((s) => (
              <option key={s} value={s}>
                Settimana {s}
              </option>
            ))}
          </select>
        </div>

        {/* Selettore vista */}
        <div className={styles.controlGroup}>
          <label>Vista:</label>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.btn} ${viewMode === "circular" ? styles.active : ""}`}
              onClick={() => {
                setViewMode("circular");
                setSelectedCluster(null);
              }}
            >
              Circular
            </button>
            <button
              className={`${styles.btn} ${viewMode === "clusters" ? styles.active : ""}`}
              onClick={() => {
                setViewMode("clusters");
                setSelectedCluster(null);
              }}
            >
              Cluster
            </button>
          </div>
        </div>

        {/* Bottone Matchmaker */}
        <div className={styles.controlGroup}>
          <button
            className={`${styles.btn} ${styles.matchmaker} ${viewMode === "matchmaker" ? styles.active : ""}`}
            onClick={() => {
              setViewMode("matchmaker");
              setSelectedCluster(null);
              resetSelection();
            }}
          >
            🎯 Matchmaker
          </button>
        </div>

        {/* Bottone per tornare dalla vista cluster espanso */}
        {selectedCluster !== null && (
          <button className={`${styles.btn} ${styles.back}`} onClick={() => setSelectedCluster(null)}>
            ← Torna ai Cluster
          </button>
        )}
      </div>

      {/* === PANNELLO FILTRO (visibile quando un nodo è selezionato) === */}
      {focusedNode && (viewMode === "circular" || (viewMode === "clusters" && selectedCluster !== null)) && (
        <div className={styles.filterPanel}>
          <div className={styles.filterHeader}>
            <span className={styles.filterTitle}>
              <strong>{focusedNode.label}</strong>
            </span>
            <button
              className={styles.btnSmall}
              onClick={() => {
                setFocusedNode(null);
                setMinWeight(1);
                setTopN(0);
              }}
            >
              ✕
            </button>
          </div>

          {/* Toggle tra modalità filtro */}
          <div className={styles.filterToggle}>
            <button className={`${styles.filterBtn} ${filterMode === "topN" ? styles.active : ""}`} onClick={() => setFilterMode("topN")}>
              Top N
            </button>
            <button className={`${styles.filterBtn} ${filterMode === "weight" ? styles.active : ""}`} onClick={() => setFilterMode("weight")}>
              Peso min
            </button>
          </div>

          <div className={styles.filterContent}>
            {/* Bottoni Top N */}
            {filterMode === "topN" && (
              <>
                <label>Mostra top:</label>
                <div className={styles.topNButtons}>
                  {[1, 2, 3, 5, 10]
                    .filter((n) => n <= focusedNodeInfo.connectionCount)
                    .map((n) => (
                      <button key={n} className={`${styles.topNBtn} ${topN === n ? styles.active : ""}`} onClick={() => setTopN(n)}>
                        {n}
                      </button>
                    ))}
                  <button className={`${styles.topNBtn} ${topN === 0 ? styles.active : ""}`} onClick={() => setTopN(0)}>
                    Tutti
                  </button>
                </div>
              </>
            )}

            {/* Slider Peso Minimo */}
            {filterMode === "weight" && (
              <>
                <label>
                  Peso minimo: <strong>{minWeight}</strong>
                </label>
                <input type="range" min="1" max={focusedNodeInfo.maxWeight} value={minWeight} onChange={(e) => setMinWeight(Number(e.target.value))} className={styles.slider} />
                <span className={styles.filterInfo}>1 — {focusedNodeInfo.maxWeight}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* === INFO VISTA CORRENTE === */}
      {data && (
        <div className={styles.viewInfo}>
          {viewMode === "circular" && !focusedNode && `${data.graph.nodes.length} persone • Click su un nodo per filtrare`}
          {viewMode === "circular" && focusedNode && filterMode === "topN" && `${focusedNode.label}: Top ${topN || "tutte le"} connessioni`}
          {viewMode === "circular" && focusedNode && filterMode === "weight" && `${focusedNode.label}: peso ≥ ${minWeight}`}
          {viewMode === "clusters" && selectedCluster === null && `${data.clusters.clusters.length} cluster trovati`}
          {viewMode === "clusters" && selectedCluster !== null && !focusedNode && `Cluster ${selectedCluster} • Click su un nodo per filtrare`}
          {viewMode === "clusters" && selectedCluster !== null && focusedNode && filterMode === "topN" && `${focusedNode.label}: Top ${topN || "tutte le"} connessioni`}
          {viewMode === "clusters" && selectedCluster !== null && focusedNode && filterMode === "weight" && `${focusedNode.label}: peso ≥ ${minWeight}`}
          {viewMode === "matchmaker" && matchmakerMode === "auto" && `${selectedPairs.length} coppie suggerite`}
          {viewMode === "matchmaker" && matchmakerMode === "manual" && !firstSelection && `Seleziona una persona`}
          {viewMode === "matchmaker" && matchmakerMode === "manual" && firstSelection && `${firstSelection.label}: ${availableCandidates.size} candidati`}
        </div>
      )}

      {/* === PANNELLO MATCHMAKER === */}
      {viewMode === "matchmaker" && (
        <div className={styles.matchmakerPanel}>
          <div className={styles.matchmakerHeader}>
            <h4>🎯 Matchmaker</h4>
          </div>

          {/* Toggle Auto/Manuale */}
          <div className={styles.matchmakerToggle}>
            <button
              className={`${styles.toggleBtn} ${matchmakerMode === "auto" ? styles.active : ""}`}
              onClick={() => {
                setMatchmakerMode("auto");
                applyAutoMatching();
              }}
            >
              ⚡ Auto
            </button>
            <button
              className={`${styles.toggleBtn} ${matchmakerMode === "manual" ? styles.active : ""}`}
              onClick={() => {
                setMatchmakerMode("manual");
                resetSelection();
              }}
            >
              ✋ Manuale
            </button>
          </div>

          {/* Istruzioni */}
          {matchmakerMode === "manual" && (
            <div className={styles.matchmakerInstructions}>
              <p>
                <strong>1.</strong> Clicca persona (blu)
              </p>
              <p>
                <strong>2.</strong> Clicca candidato (verde)
              </p>
              {/* Mostra conteggio disponibili */}
              {data &&
                (() => {
                  const available = data.clusters.nodes.filter((n) => !usedNodes.has(n.id)).length;
                  if (available > 0 && selectedPairs.length > 0) {
                    return <p style={{ color: available === 1 ? "#e74c3c" : "#666", marginTop: "8px" }}>{available === 1 ? "⚠ 1 persona rimarrà sola" : `${available} persone disponibili`}</p>;
                  }
                  return null;
                })()}
            </div>
          )}

          {matchmakerMode === "auto" && (
            <div className={styles.matchmakerInstructions}>
              <p>Coppie ottimali calcolate.</p>
              {/* Mostra nodi rimasti senza coppia */}
              {data &&
                (() => {
                  const totalNodes = data.clusters.nodes.length;
                  const pairedNodes = selectedPairs.length * 2;
                  const remaining = totalNodes - pairedNodes;
                  if (remaining > 0) {
                    return (
                      <p style={{ color: "#e74c3c", marginTop: "8px" }}>
                        ⚠ {remaining} {remaining === 1 ? "persona rimasta" : "persone rimaste"} senza coppia
                      </p>
                    );
                  }
                  return null;
                })()}
            </div>
          )}

          {/* Lista coppie formate */}
          {selectedPairs.length > 0 && (
            <>
              <div className={styles.pairsHeader}>
                <h5>Coppie ({selectedPairs.length})</h5>
                <button className={styles.btnSmall} onClick={resetSelection}>
                  Reset
                </button>
              </div>
              <div className={styles.selectedPairsList}>
                {selectedPairs.map((pair, i) => (
                  <div key={i} className={styles.selectedPair}>
                    <span>
                      {pair.sourceLabel} ↔ {pair.targetLabel}
                    </span>
                    {matchmakerMode === "manual" && (
                      <button className={styles.removePair} onClick={() => removePair(i)}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Mostra chi è rimasto senza coppia */}
              {data &&
                (() => {
                  const unpaired = data.clusters.nodes.filter((n) => !usedNodes.has(n.id));
                  if (unpaired.length > 0 && unpaired.length <= 5) {
                    return (
                      <div className={styles.unpairedSection}>
                        <h5>Senza coppia ({unpaired.length})</h5>
                        <div className={styles.unpairedList}>
                          {unpaired.map((node) => (
                            <span key={node.id} className={styles.unpairedNode}>
                              {node.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
            </>
          )}
        </div>
      )}

      {/* === SVG PRINCIPALE === */}
      <svg ref={svgRef} className={styles.svg}></svg>

      {/* === TOOLTIP === */}
      <div ref={tooltipRef} className={styles.tooltip}></div>

      {/* === LEGENDA === */}
      {viewMode === "matchmaker" && matchmakerMode === "manual" && (
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.dot} style={{ background: "#3498db" }}></span> Disponibile
          </span>
          <span className={styles.legendItem}>
            <span className={styles.dot} style={{ background: "#e74c3c" }}></span> Selezionato
          </span>
          <span className={styles.legendItem}>
            <span className={styles.dot} style={{ background: "#27ae60" }}></span> Candidato
          </span>
          <span className={styles.legendItem}>
            <span className={styles.dot} style={{ background: "#95a5a6" }}></span> Accoppiato
          </span>
        </div>
      )}

      {(viewMode === "circular" || (viewMode === "clusters" && selectedCluster !== null)) && !focusedNode && (
        <div className={styles.legend}>
          <span className={styles.legendItem}>Hover: mostra connessioni</span>
          <span className={styles.legendItem}>Click: seleziona e filtra</span>
        </div>
      )}

      {focusedNode && filterMode === "topN" && topN > 0 && (
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.dot} style={{ background: "#e74c3c" }}></span> Top {topN} connessioni
          </span>
        </div>
      )}
    </div>
  );
}

export default GraphVisualization;
