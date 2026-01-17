
"""
ANALISI GRAFO SOCIALE - Ping Time
Output ottimizzato per D3.js

Per ogni DOMANDA → JSON pronto per la visualizzazione
"""

import pandas as pd
import numpy as np
import os
import json
from collections import defaultdict
import networkx as nx
from networkx.algorithms import community


class SocialGraphAnalyzer:
    """
    Analizzatore di grafi sociali per PingTime.
    Output JSON-ready per D3.js.
    """
    
    def __init__(self, adj_matrix, labels=None):
        if isinstance(adj_matrix, pd.DataFrame):
            self.labels = adj_matrix.index.tolist()
            self.adj_matrix = adj_matrix.values
        else:
            self.adj_matrix = adj_matrix
            self.labels = labels if labels else list(range(len(adj_matrix)))
        
        self.n = len(self.adj_matrix)
        self.G = self._build_networkx_graph()
    
    def _build_networkx_graph(self):
        """Costruisce il grafo NetworkX."""
        G = nx.Graph()
        for i in range(self.n):
            G.add_node(i, label=self.labels[i])
        
        for i in range(self.n):
            for j in range(i + 1, self.n):
                if self.adj_matrix[i][j] > 0:
                    G.add_edge(i, j, weight=int(self.adj_matrix[i][j]))
        return G
    
    # =========================================================================
    # GRAFO BASE - Node-Link per D3.js Force Layout
    # =========================================================================
    
    def get_graph_data(self):
        """
        Restituisce il grafo in formato node-link per D3.js force layout.
        
        Returns:
            dict: {
                nodes: [{id, label, degree, ...}],
                links: [{source, target, weight}]
            }
        """
        nodes = []
        for i in range(self.n):
            degree = self.G.degree(i)
            if degree > 0:  # Solo nodi attivi
                nodes.append({
                    'id': i,
                    'label': self.labels[i],
                    'degree': degree
                })
        
        links = []
        for u, v, data in self.G.edges(data=True):
            links.append({
                'source': u,
                'target': v,
                'weight': int(data['weight'])
            })
        
        return {'nodes': nodes, 'links': links}
    
    # =========================================================================
    # DOMANDA 1: Chi gioca spesso insieme? → Cluster
    # =========================================================================
    
    def get_clusters(self):
        """
        Cluster Louvain per D3.js.
        
        Returns:
            dict: {
                nodes: [{id, label, cluster, degree}],
                links: [{source, target, weight, sameCluster}],
                clusters: [{id, size, members}]
            }
        """
        active = [n for n in self.G.nodes() if self.G.degree(n) > 0]
        if len(active) < 2:
            return {'nodes': [], 'links': [], 'clusters': []}
        
        G_active = self.G.subgraph(active)
        cluster_sets = list(community.louvain_communities(G_active, weight='weight'))
        
        # Mappa nodo -> cluster
        node_to_cluster = {}
        for i, cluster in enumerate(cluster_sets):
            for node in cluster:
                node_to_cluster[node] = i
        
        # Nodes con cluster
        nodes = []
        for i in active:
            nodes.append({
                'id': i,
                'label': self.labels[i],
                'cluster': node_to_cluster.get(i, -1),
                'degree': self.G.degree(i)
            })
        
        # Links con info cluster
        links = []
        for u, v, data in self.G.edges(data=True):
            c_u = node_to_cluster.get(u, -1)
            c_v = node_to_cluster.get(v, -1)
            links.append({
                'source': u,
                'target': v,
                'weight': int(data['weight']),
                'sameCluster': c_u == c_v
            })
        
        # Cluster info
        clusters = []
        for i, cluster in enumerate(cluster_sets):
            clusters.append({
                'id': i,
                'size': len(cluster),
                'members': [self.labels[n] for n in cluster]
            })
        
        return {
            'nodes': nodes,
            'links': links,
            'clusters': sorted(clusters, key=lambda x: -x['size'])
        }
    
    # =========================================================================
    # DOMANDA 2: Chi non ha mai giocato insieme? → Antimatching
    # =========================================================================
    
    def get_antimatching(self):
        """
        Coppie che non hanno mai giocato insieme.
        
        Returns:
            dict: {
                suggestedPairs: [{source, target, sourceLabel, targetLabel}],
                totalMissingConnections: int
            }
        """
        active = [n for n in self.G.nodes() if self.G.degree(n) > 0]
        if len(active) < 2:
            return {'suggestedPairs': [], 'totalMissingConnections': 0}
        
        G_active = self.G.subgraph(active).copy()
        G_complement = nx.complement(G_active)
        
        # Tutte le coppie mancanti
        all_missing = list(G_complement.edges())
        
        # Matching ottimale sul complemento
        matching = nx.max_weight_matching(G_complement, maxcardinality=True)
        
        pairs = []
        for u, v in matching:
            pairs.append({
                'source': u,
                'target': v,
                'sourceLabel': self.labels[u],
                'targetLabel': self.labels[v]
            })
        
        # Anti-edges: tutte le coppie che non hanno mai giocato
        antiedges = []
        for u, v in all_missing:
            antiedges.append({
                'source': u,
                'target': v,
                'sourceLabel': self.labels[u],
                'targetLabel': self.labels[v]
            })
        
        # Independent set massimale
        independent_set = nx.maximal_independent_set(G_active)
        independent_set_labels = [self.labels[i] for i in independent_set]
        
        return {
            'suggestedPairs': pairs,
            'totalMissingConnections': len(all_missing),
            'antiedges': antiedges,
            'independentSet': list(independent_set),
            'independentSetLabels': sorted(independent_set_labels)
        }
    
    # =========================================================================
    # DOMANDA 3: Chi sono le persone chiave? → Centralità
    # =========================================================================
    
    def get_key_people(self):
        """
        Persone chiave con metriche di centralità.
        
        Returns:
            dict: {
                nodes: [{id, label, degree, betweenness, isCutVertex}],
                cutVertices: [labels],
                topCentral: [{label, betweenness}]
            }
        """
        cut_vertices = set(nx.articulation_points(self.G))
        betweenness = nx.betweenness_centrality(self.G, weight='weight')
        
        nodes = []
        for i in range(self.n):
            degree = self.G.degree(i)
            if degree > 0:
                nodes.append({
                    'id': i,
                    'label': self.labels[i],
                    'degree': degree,
                    'betweenness': round(betweenness[i], 4),
                    'isCutVertex': i in cut_vertices
                })
        
        # Ordina per betweenness
        nodes_sorted = sorted(nodes, key=lambda x: -x['betweenness'])
        
        return {
            'nodes': nodes,
            'cutVertices': [self.labels[i] for i in cut_vertices],
            'topCentral': nodes_sorted[:10]
        }
    
    # =========================================================================
    # DOMANDA 4: Connessioni critiche → Bridge Edges
    # =========================================================================
    
    def get_critical_connections(self):
        """
        Connessioni critiche (bridge edges).
        
        Returns:
            dict: {
                bridges: [{source, target, sourceLabel, targetLabel, weight}],
                links: [{source, target, weight, isBridge}]
            }
        """
        bridge_set = set(nx.bridges(self.G))
        
        bridges = []
        for u, v in bridge_set:
            bridges.append({
                'source': u,
                'target': v,
                'sourceLabel': self.labels[u],
                'targetLabel': self.labels[v],
                'weight': int(self.adj_matrix[u][v])
            })
        
        # Tutti i link con flag isBridge
        links = []
        for u, v, data in self.G.edges(data=True):
            is_bridge = (u, v) in bridge_set or (v, u) in bridge_set
            links.append({
                'source': u,
                'target': v,
                'weight': int(data['weight']),
                'isBridge': is_bridge
            })
        
        return {
            'bridges': sorted(bridges, key=lambda x: -x['weight']),
            'links': links
        }
    
    # =========================================================================
    # DOMANDA 5: Gruppi perfetti → Clique
    # =========================================================================
    
    def get_cliques(self, min_size=3):
        """
        Clique (gruppi dove tutti hanno giocato con tutti).
        
        Returns:
            dict: {
                cliques: [{id, size, members, memberIds}],
                maxCliqueSize: int
            }
        """
        cliques_raw = list(nx.find_cliques(self.G))
        cliques_filtered = [c for c in cliques_raw if len(c) >= min_size]
        
        cliques = []
        for i, clique in enumerate(sorted(cliques_filtered, key=len, reverse=True)):
            cliques.append({
                'id': i,
                'size': len(clique),
                'members': sorted([self.labels[n] for n in clique]),
                'memberIds': list(clique)
            })
        
        max_size = max([c['size'] for c in cliques]) if cliques else 0
        
        return {
            'cliques': cliques,
            'maxCliqueSize': max_size
        }
    
    # =========================================================================
    # DOMANDA 6: Nucleo attivo → K-Core
    # =========================================================================
    
    def get_kcore(self):
        """
        K-Core decomposition.
        
        Returns:
            dict: {
                nodes: [{id, label, coreNumber}],
                cores: [{k, size, members}],
                maxK: int
            }
        """
        core_numbers = nx.core_number(self.G)
        
        nodes = []
        for i in range(self.n):
            k = core_numbers[i]
            if k > 0:
                nodes.append({
                    'id': i,
                    'label': self.labels[i],
                    'coreNumber': k
                })
        
        # Raggruppa per k
        cores_dict = defaultdict(list)
        for i, k in core_numbers.items():
            if k > 0:
                cores_dict[k].append(self.labels[i])
        
        cores = []
        for k in sorted(cores_dict.keys(), reverse=True):
            cores.append({
                'k': k,
                'size': len(cores_dict[k]),
                'members': sorted(cores_dict[k])
            })
        
        max_k = max(core_numbers.values()) if core_numbers else 0
        
        return {
            'nodes': nodes,
            'cores': cores,
            'maxK': max_k
        }
    
    # =========================================================================
    # DOMANDA 7: Connessioni tra gruppi → Inter-cluster edges
    # =========================================================================
    
    def get_inter_cluster_connections(self):
        """
        Connessioni tra cluster diversi.
        
        Returns:
            dict: {
                interClusterLinks: [{source, target, weight, cluster1, cluster2}],
                clusterConnections: [{from, to, totalWeight, linkCount}]
            }
        """
        active = [n for n in self.G.nodes() if self.G.degree(n) > 0]
        if len(active) < 2:
            return {'interClusterLinks': [], 'clusterConnections': []}
        
        G_active = self.G.subgraph(active)
        clusters = list(community.louvain_communities(G_active, weight='weight'))
        
        node_to_cluster = {}
        for i, cluster in enumerate(clusters):
            for node in cluster:
                node_to_cluster[node] = i
        
        inter_links = []
        cluster_pairs = defaultdict(lambda: {'totalWeight': 0, 'linkCount': 0})
        
        for u, v, data in self.G.edges(data=True):
            c_u = node_to_cluster.get(u, -1)
            c_v = node_to_cluster.get(v, -1)
            if c_u != -1 and c_v != -1 and c_u != c_v:
                weight = int(data['weight'])
                inter_links.append({
                    'source': u,
                    'target': v,
                    'sourceLabel': self.labels[u],
                    'targetLabel': self.labels[v],
                    'weight': weight,
                    'cluster1': c_u,
                    'cluster2': c_v
                })
                
                pair_key = (min(c_u, c_v), max(c_u, c_v))
                cluster_pairs[pair_key]['totalWeight'] += weight
                cluster_pairs[pair_key]['linkCount'] += 1
        
        cluster_connections = []
        for (c1, c2), data in cluster_pairs.items():
            cluster_connections.append({
                'from': c1,
                'to': c2,
                'totalWeight': data['totalWeight'],
                'linkCount': data['linkCount']
            })
        
        return {
            'interClusterLinks': sorted(inter_links, key=lambda x: -x['weight']),
            'clusterConnections': sorted(cluster_connections, key=lambda x: -x['totalWeight'])
        }
    
    # =========================================================================
    # EXPORT COMPLETO per D3.js
    # =========================================================================
    
    def get_full_analysis(self):
        """
        Restituisce TUTTI i dati in un unico JSON per D3.js.
        """
        return {
            'graph': self.get_graph_data(),
            'clusters': self.get_clusters(),
            'antimatching': self.get_antimatching(),
            'keyPeople': self.get_key_people(),
            'criticalConnections': self.get_critical_connections(),
            'cliques': self.get_cliques(),
            'kcore': self.get_kcore(),
            'interCluster': self.get_inter_cluster_connections()
        }
    
    def export_json(self, output_path):
        """Esporta l'analisi completa in JSON."""
        data = self.get_full_analysis()
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Esportato: {output_path}")
        return data


# =============================================================================
# FUNZIONI DI UTILITÀ
# =============================================================================

def analizza_settimana(csv_path):
    """Analizza una matrice di adiacenza da file CSV."""
    if not os.path.exists(csv_path):
        print(f"File non trovato: {csv_path}")
        return None
    
    adj_df = pd.read_csv(csv_path, index_col=0)
    return SocialGraphAnalyzer(adj_df)


def esporta_tutte_le_settimane(output_dir=None):
    """Esporta JSON per tutte le settimane."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if output_dir is None:
        output_dir = script_dir
    
    import glob
    pattern = os.path.join(script_dir, 'pingtime_AdjMatrix_settimana_*.csv')
    files = sorted(glob.glob(pattern))
    
    if not files:
        print("Nessuna matrice trovata.")
        return
    
    results = {}
    for filepath in files:
        filename = os.path.basename(filepath)
        settimana = filename.replace('pingtime_AdjMatrix_settimana_', '').replace('.csv', '')
        
        analyzer = analizza_settimana(filepath)
        if analyzer:
            output_path = os.path.join(output_dir, f'analysis_settimana_{settimana}.json')
            results[settimana] = analyzer.export_json(output_path)
    
    return results


if __name__ == "__main__":
    # Esporta JSON per TUTTE le settimane
    print("Esportazione JSON per D3.js...")
    esporta_tutte_le_settimane()
    print("\nTutti i JSON sono stati generati!")
