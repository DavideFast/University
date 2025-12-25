import pandas as pd
import numpy as np
import os
from collections import defaultdict
import networkx as nx
from networkx.algorithms import community

class GraphAnalyzer:
    """
    Classe per analizzare un grafo e trovare cut vertex e blocchi
    usando l'algoritmo di Hopcroft-Tarjan.
    """
    
    def __init__(self, adj_matrix, labels=None):
        """
        Args:
            adj_matrix: matrice di adiacenza (numpy array o DataFrame)
            labels: etichette dei nodi (opzionale)
        """
        if isinstance(adj_matrix, pd.DataFrame):
            self.labels = adj_matrix.index.tolist()
            self.adj_matrix = adj_matrix.values
        else:
            self.adj_matrix = adj_matrix
            self.labels = labels if labels else list(range(len(adj_matrix)))
        
        self.n = len(self.adj_matrix)
        self.adj_list = self._build_adj_list()
        
    def _build_adj_list(self):
        """Costruisce la lista di adiacenza dal grafo pesato (arco se peso > 0)."""
        adj_list = defaultdict(list)
        for i in range(self.n):
            for j in range(i + 1, self.n):
                if self.adj_matrix[i][j] > 0:
                    adj_list[i].append(j)
                    adj_list[j].append(i)
        return adj_list
    
    def find_articulation_points_and_blocks(self):
        """
        Trova i cut vertex (punti di articolazione) e i blocchi (componenti biconnesse)
        usando l'algoritmo di Hopcroft-Tarjan.
        
        Returns:
            tuple: (cut_vertices, blocks)
                - cut_vertices: set di indici dei cut vertex
                - blocks: lista di blocchi, ogni blocco è un set di archi (i, j)
        """
        visited = [False] * self.n
        disc = [0] * self.n  # Discovery time
        low = [0] * self.n   # Lowest reachable vertex
        parent = [-1] * self.n
        
        cut_vertices = set()
        blocks = []
        stack = []  # Stack per gli archi
        self.time = 0
        
        def dfs(u):
            children = 0
            visited[u] = True
            disc[u] = low[u] = self.time
            self.time += 1
            
            for v in self.adj_list[u]:
                if not visited[v]:
                    children += 1
                    parent[v] = u
                    stack.append((u, v))
                    
                    dfs(v)
                    
                    low[u] = min(low[u], low[v])
                    
                    # u è un cut vertex se:
                    # 1. u è radice e ha più di un figlio
                    # 2. u non è radice e low[v] >= disc[u]
                    if (parent[u] == -1 and children > 1) or \
                       (parent[u] != -1 and low[v] >= disc[u]):
                        cut_vertices.add(u)
                        
                        # Estrai il blocco
                        block = set()
                        while stack and stack[-1] != (u, v):
                            edge = stack.pop()
                            block.add(edge)
                        if stack:
                            block.add(stack.pop())
                        if block:
                            blocks.append(block)
                            
                elif v != parent[u]:
                    low[u] = min(low[u], disc[v])
                    if disc[v] < disc[u]:
                        stack.append((u, v))
        
        # Esegui DFS per ogni componente connessa
        for i in range(self.n):
            if not visited[i]:
                dfs(i)
                # Estrai l'ultimo blocco se rimangono archi
                if stack:
                    blocks.append(set(stack))
                    stack = []
        
        return cut_vertices, blocks
    
    def get_cut_vertex_labels(self):
        """Ritorna le etichette dei cut vertex."""
        cut_vertices, _ = self.find_articulation_points_and_blocks()
        return [self.labels[i] for i in cut_vertices]
    
    def get_blocks_with_labels(self):
        """Ritorna i blocchi con le etichette dei nodi invece degli indici."""
        _, blocks = self.find_articulation_points_and_blocks()
        
        blocks_labeled = []
        for block in blocks:
            # Estrai i nodi unici dal blocco (che contiene archi)
            nodes = set()
            for u, v in block:
                nodes.add(self.labels[u])
                nodes.add(self.labels[v])
            blocks_labeled.append(nodes)
        
        return blocks_labeled
    
    def find_bridges(self):
        """
        Trova i bridge edges (archi ponte) del grafo.
        Un bridge è un arco la cui rimozione disconnette il grafo.
        
        Returns:
            list: lista di tuple (u, v) rappresentanti i bridge edges (come indici)
        """
        visited = [False] * self.n
        disc = [0] * self.n  # Discovery time
        low = [0] * self.n   # Lowest reachable vertex
        parent = [-1] * self.n
        bridges = []
        self.bridge_time = 0
        
        def dfs(u):
            visited[u] = True
            disc[u] = low[u] = self.bridge_time
            self.bridge_time += 1
            
            for v in self.adj_list[u]:
                if not visited[v]:
                    parent[v] = u
                    dfs(v)
                    low[u] = min(low[u], low[v])
                    
                    # (u, v) è un bridge se low[v] > disc[u]
                    if low[v] > disc[u]:
                        bridges.append((u, v))
                        
                elif v != parent[u]:
                    low[u] = min(low[u], disc[v])
        
        # Esegui DFS per ogni componente connessa
        for i in range(self.n):
            if not visited[i]:
                dfs(i)
        
        return bridges
    
    def get_bridges_with_labels(self):
        """Ritorna i bridge edges con le etichette dei nodi."""
        bridges = self.find_bridges()
        return [(self.labels[u], self.labels[v]) for u, v in bridges]
    
    def get_bridge_weights(self):
        """Ritorna i bridge edges con i loro pesi originali."""
        bridges = self.find_bridges()
        result = []
        for u, v in bridges:
            weight = self.adj_matrix[u][v]
            result.append((self.labels[u], self.labels[v], weight))
        return result
    
    def _build_networkx_graph(self):
        """Costruisce un grafo NetworkX dalla matrice di adiacenza."""
        G = nx.Graph()
        G.add_nodes_from(range(self.n))
        
        for i in range(self.n):
            for j in range(i + 1, self.n):
                if self.adj_matrix[i][j] > 0:
                    G.add_edge(i, j, weight=self.adj_matrix[i][j])
        
        return G
    
    def find_clusters_louvain(self):
        """
        Trova i cluster usando l'algoritmo di Louvain (community detection).
        Ottimizza la modularità del grafo.
        
        Returns:
            list: lista di set, ogni set contiene gli indici dei nodi nel cluster
        """
        G = self._build_networkx_graph()
        
        # Rimuovi nodi isolati per l'analisi
        nodes_with_edges = [n for n in G.nodes() if G.degree(n) > 0]
        G_sub = G.subgraph(nodes_with_edges)
        
        if len(G_sub.nodes()) == 0:
            return []
        
        # Usa Louvain per trovare le comunità
        clusters = community.louvain_communities(G_sub, weight='weight')
        
        return [set(c) for c in clusters]
    
    def find_clusters_label_propagation(self):
        """
        Trova i cluster usando Label Propagation.
        Algoritmo molto veloce O(n).
        
        Returns:
            list: lista di set, ogni set contiene gli indici dei nodi nel cluster
        """
        G = self._build_networkx_graph()
        
        nodes_with_edges = [n for n in G.nodes() if G.degree(n) > 0]
        G_sub = G.subgraph(nodes_with_edges)
        
        if len(G_sub.nodes()) == 0:
            return []
        
        clusters = community.label_propagation_communities(G_sub)
        
        return [set(c) for c in clusters]
    
    def find_connected_components(self):
        """
        Trova le componenti connesse del grafo.
        
        Returns:
            list: lista di set, ogni set contiene gli indici dei nodi nella componente
        """
        G = self._build_networkx_graph()
        components = list(nx.connected_components(G))
        
        # Filtra componenti con almeno 2 nodi
        return [c for c in components if len(c) >= 2]
    
    def get_clusters_with_labels(self, method='louvain'):
        """
        Ritorna i cluster con le etichette dei nodi.
        
        Args:
            method: 'louvain', 'label_propagation', o 'connected_components'
        
        Returns:
            list: lista di set con le etichette dei nodi
        """
        if method == 'louvain':
            clusters = self.find_clusters_louvain()
        elif method == 'label_propagation':
            clusters = self.find_clusters_label_propagation()
        elif method == 'connected_components':
            clusters = self.find_connected_components()
        else:
            raise ValueError(f"Metodo sconosciuto: {method}")
        
        return [{self.labels[i] for i in cluster} for cluster in clusters]
    
    def print_clusters(self, method='louvain'):
        """Stampa i cluster trovati con il metodo specificato."""
        clusters = self.get_clusters_with_labels(method)
        
        print(f"\n{'='*60}")
        print(f"CLUSTERS ({method.upper()}): {len(clusters)}")
        print("=" * 60)
        
        # Ordina cluster per dimensione (dal più grande)
        clusters_sorted = sorted(clusters, key=len, reverse=True)
        
        for i, cluster in enumerate(clusters_sorted, 1):
            print(f"\n  Cluster {i}: {len(cluster)} nodi")
            print(f"    {sorted(cluster)}")
        
        return clusters
    
    def find_inter_cluster_edges(self, method='louvain'):
        """
        Trova gli archi di taglio tra cluster diversi (inter-cluster edges).
        Questi sono archi che connettono nodi appartenenti a cluster diversi.
        
        Args:
            method: metodo di clustering ('louvain', 'label_propagation', 'connected_components')
        
        Returns:
            list: lista di tuple (u, v, peso, cluster_u, cluster_v)
        """
        # Trova i cluster
        if method == 'louvain':
            clusters = self.find_clusters_louvain()
        elif method == 'label_propagation':
            clusters = self.find_clusters_label_propagation()
        else:
            clusters = self.find_connected_components()
        
        # Crea una mappa nodo -> cluster_id
        node_to_cluster = {}
        for cluster_id, cluster in enumerate(clusters):
            for node in cluster:
                node_to_cluster[node] = cluster_id
        
        # Trova gli archi tra cluster diversi
        inter_cluster_edges = []
        
        for i in range(self.n):
            for j in range(i + 1, self.n):
                if self.adj_matrix[i][j] > 0:
                    # Verifica se i nodi sono in cluster diversi
                    cluster_i = node_to_cluster.get(i, -1)
                    cluster_j = node_to_cluster.get(j, -1)
                    
                    if cluster_i != -1 and cluster_j != -1 and cluster_i != cluster_j:
                        weight = self.adj_matrix[i][j]
                        inter_cluster_edges.append((i, j, weight, cluster_i, cluster_j))
        
        return inter_cluster_edges
    
    def get_inter_cluster_edges_with_labels(self, method='louvain'):
        """
        Ritorna gli archi di taglio tra cluster con le etichette dei nodi.
        
        Returns:
            list: lista di dict con info sull'arco
        """
        edges = self.find_inter_cluster_edges(method)
        result = []
        
        for u, v, weight, cluster_u, cluster_v in edges:
            result.append({
                'node1': self.labels[u],
                'node2': self.labels[v],
                'weight': weight,
                'cluster1': cluster_u,
                'cluster2': cluster_v
            })
        
        return result
    
    def print_inter_cluster_edges(self, method='louvain'):
        """Stampa gli archi di taglio tra cluster."""
        edges = self.find_inter_cluster_edges(method)
        
        print(f"\n{'='*60}")
        print(f"ARCHI DI TAGLIO TRA CLUSTER ({method.upper()}): {len(edges)}")
        print("=" * 60)
        
        if not edges:
            print("  Nessun arco di taglio trovato (cluster completamente separati)")
            return []
        
        # Raggruppa per coppia di cluster
        from collections import defaultdict
        edges_by_clusters = defaultdict(list)
        
        for u, v, weight, cluster_u, cluster_v in edges:
            key = tuple(sorted([cluster_u, cluster_v]))
            edges_by_clusters[key].append((u, v, weight))
        
        # Stampa raggruppati
        for (c1, c2), edge_list in sorted(edges_by_clusters.items()):
            print(f"\n  Cluster {c1} <-> Cluster {c2}: {len(edge_list)} archi")
            
            # Calcola peso totale
            total_weight = sum(w for _, _, w in edge_list)
            print(f"    Peso totale: {total_weight}")
            
            # Mostra i singoli archi
            for u, v, w in sorted(edge_list, key=lambda x: -x[2])[:5]:  # Top 5 per peso
                print(f"      - {self.labels[u]} <-> {self.labels[v]} (peso: {w})")
            
            if len(edge_list) > 5:
                print(f"      ... e altri {len(edge_list) - 5} archi")
        
        return edges
    
    def find_anti_edges(self):
        """
        Trova tutte le coppie di nodi che NON sono connessi (anti-edges).
        Nel contesto: coppie di persone che non hanno mai giocato insieme.
        
        Returns:
            list: lista di tuple (i, j) rappresentanti coppie non connesse
        """
        anti_edges = []
        
        # Considera solo i nodi che hanno almeno un arco (sono attivi)
        active_nodes = [i for i in range(self.n) if self.adj_list[i]]
        
        for i, node_i in enumerate(active_nodes):
            for node_j in active_nodes[i+1:]:
                if self.adj_matrix[node_i][node_j] == 0:
                    anti_edges.append((node_i, node_j))
        
        return anti_edges
    
    def get_anti_edges_with_labels(self):
        """Ritorna le anti-edges con le etichette dei nodi."""
        anti_edges = self.find_anti_edges()
        return [(self.labels[u], self.labels[v]) for u, v in anti_edges]
    
    def find_maximal_independent_set(self):
        """
        Trova un Maximal Independent Set (MIS) usando un algoritmo greedy.
        Un MIS è un insieme di nodi dove nessuna coppia è connessa.
        
        Nel contesto: il gruppo più grande possibile di persone che non hanno
        mai giocato insieme (nessuna coppia nel gruppo ha mai giocato insieme).
        
        Returns:
            set: insieme di indici dei nodi nel MIS
        """
        G = self._build_networkx_graph()
        
        # Considera solo nodi attivi
        active_nodes = {n for n in G.nodes() if G.degree(n) > 0}
        
        if not active_nodes:
            return set()
        
        # Greedy: seleziona nodi con grado minimo
        independent_set = set()
        remaining = active_nodes.copy()
        
        while remaining:
            # Trova il nodo con grado minimo nel sottografo rimanente
            min_degree_node = min(remaining, key=lambda n: len([x for x in G.neighbors(n) if x in remaining]))
            
            independent_set.add(min_degree_node)
            
            # Rimuovi il nodo e tutti i suoi vicini
            neighbors = set(G.neighbors(min_degree_node))
            remaining.discard(min_degree_node)
            remaining -= neighbors
        
        return independent_set
    
    def find_maximum_independent_set_approx(self):
        """
        Trova un'approssimazione del Maximum Independent Set.
        Usa NetworkX per trovare il complemento e poi il clique massimo.
        
        Returns:
            set: insieme di indici dei nodi
        """
        G = self._build_networkx_graph()
        
        # Considera solo nodi attivi
        active_nodes = [n for n in G.nodes() if G.degree(n) > 0]
        G_active = G.subgraph(active_nodes).copy()
        
        if len(G_active.nodes()) == 0:
            return set()
        
        # Il Maximum Independent Set di G è il Maximum Clique del complemento di G
        G_complement = nx.complement(G_active)
        
        # Trova il clique massimo approssimato
        cliques = list(nx.find_cliques(G_complement))
        if cliques:
            max_clique = max(cliques, key=len)
            return set(max_clique)
        
        return set()
    
    def get_independent_set_with_labels(self, method='greedy'):
        """
        Ritorna l'independent set con le etichette dei nodi.
        
        Args:
            method: 'greedy' o 'approx'
        """
        if method == 'greedy':
            ind_set = self.find_maximal_independent_set()
        else:
            ind_set = self.find_maximum_independent_set_approx()
        
        return {self.labels[i] for i in ind_set}
    
    def find_antimatching(self):
        """
        Trova l'antimatching: un matching massimo sul grafo complemento.
        Cioè, coppie di persone che NON hanno mai giocato insieme,
        dove ogni persona appare in al massimo una coppia.
        
        Returns:
            list: lista di tuple (i, j) rappresentanti l'antimatching
        """
        G = self._build_networkx_graph()
        
        # Considera solo nodi attivi
        active_nodes = [n for n in G.nodes() if G.degree(n) > 0]
        G_active = G.subgraph(active_nodes).copy()
        
        if len(G_active.nodes()) < 2:
            return []
        
        # Costruisci il grafo complemento
        G_complement = nx.complement(G_active)
        
        # Trova il matching massimo sul complemento
        matching = nx.max_weight_matching(G_complement, maxcardinality=True)
        
        return list(matching)
    
    def get_antimatching_with_labels(self):
        """Ritorna l'antimatching con le etichette dei nodi."""
        antimatching = self.find_antimatching()
        return [(self.labels[u], self.labels[v]) for u, v in antimatching]
    
    def print_antimatching_analysis(self):
        """Stampa l'analisi completa dell'antimatching."""
        anti_edges = self.find_anti_edges()
        antimatching = self.find_antimatching()
        independent_set = self.find_maximal_independent_set()
        
        print(f"\n{'='*60}")
        print("ANTIMATCHING ANALYSIS")
        print("=" * 60)
        
        # Anti-edges
        print(f"\n  Coppie che NON hanno mai giocato insieme: {len(anti_edges)}")
        
        # Antimatching
        print(f"\n{'='*60}")
        print(f"ANTIMATCHING (Matching sul grafo complemento): {len(antimatching)} coppie")
        print("=" * 60)
        print("  Coppie di persone da far giocare insieme (non si sono mai incontrate):")
        for u, v in antimatching:
            print(f"    - {self.labels[u]} <-> {self.labels[v]}")
        
        # Independent Set
        print(f"\n{'='*60}")
        print(f"INDEPENDENT SET (Greedy): {len(independent_set)} nodi")
        print("=" * 60)
        print("  Gruppo di persone che non hanno mai giocato tra loro:")
        ind_set_labels = sorted([self.labels[i] for i in independent_set])
        print(f"    {ind_set_labels}")
    
    def print_analysis(self):
        """Stampa l'analisi completa del grafo."""
        cut_vertices, blocks = self.find_articulation_points_and_blocks()
        bridges = self.find_bridges()
        
        print("=" * 60)
        print("ANALISI DEL GRAFO")
        print("=" * 60)
        
        # Statistiche base
        n_edges = sum(len(self.adj_list[i]) for i in range(self.n)) // 2
        n_nodes_with_edges = sum(1 for i in range(self.n) if self.adj_list[i])
        
        print(f"\nNodi totali: {self.n}")
        print(f"Nodi connessi (con almeno un arco): {n_nodes_with_edges}")
        print(f"Archi totali: {n_edges}")
        
        # Cut vertices
        print(f"\n{'='*60}")
        print(f"CUT VERTICES (Punti di Articolazione): {len(cut_vertices)}")
        print("=" * 60)
        if cut_vertices:
            for idx in sorted(cut_vertices):
                print(f"  - {self.labels[idx]}")
        else:
            print("  Nessun cut vertex trovato (grafo biconnesso o disconnesso)")
        
        # Bridge edges
        print(f"\n{'='*60}")
        print(f"BRIDGE EDGES (Archi Ponte): {len(bridges)}")
        print("=" * 60)
        if bridges:
            for u, v in bridges:
                weight = self.adj_matrix[u][v]
                print(f"  - {self.labels[u]} <-> {self.labels[v]} (peso: {weight})")
        else:
            print("  Nessun bridge trovato (grafo 2-edge-connected)")
        
        # Blocchi
        print(f"\n{'='*60}")
        print(f"BLOCCHI (Componenti Biconnesse): {len(blocks)}")
        print("=" * 60)
        for i, block in enumerate(blocks, 1):
            nodes = set()
            for u, v in block:
                nodes.add(self.labels[u])
                nodes.add(self.labels[v])
            print(f"\n  Blocco {i}: {len(nodes)} nodi, {len(block)} archi")
            print(f"    Nodi: {sorted(nodes)}")
        
        # Clusters (Louvain)
        try:
            clusters = self.find_clusters_louvain()
            print(f"\n{'='*60}")
            print(f"CLUSTERS (Louvain Community Detection): {len(clusters)}")
            print("=" * 60)
            
            clusters_labeled = [{self.labels[i] for i in c} for c in clusters]
            clusters_sorted = sorted(clusters_labeled, key=len, reverse=True)
            
            for i, cluster in enumerate(clusters_sorted, 1):
                print(f"\n  Cluster {i}: {len(cluster)} nodi")
                print(f"    {sorted(cluster)}")
            
            # Archi di taglio tra cluster
            self.print_inter_cluster_edges('louvain')
            
        except Exception as e:
            print(f"\n  Errore nel calcolo dei cluster: {e}")
        
        # Antimatching
        try:
            self.print_antimatching_analysis()
        except Exception as e:
            print(f"\n  Errore nel calcolo dell'antimatching: {e}")


def analyze_adjacency_matrix(csv_path, threshold=0):
    """
    Analizza una matrice di adiacenza da file CSV.
    
    Args:
        csv_path: percorso del file CSV
        threshold: soglia minima per considerare un arco (default 0, cioè peso > 0)
    
    Returns:
        GraphAnalyzer: oggetto con i risultati dell'analisi
    """
    if not os.path.exists(csv_path):
        print(f"File non trovato: {csv_path}")
        return None
    
    # Leggi la matrice
    adj_df = pd.read_csv(csv_path, index_col=0)
    
    # Applica la soglia
    adj_matrix = adj_df.values.copy()
    adj_matrix[adj_matrix <= threshold] = 0
    
    # Crea l'analizzatore
    analyzer = GraphAnalyzer(adj_matrix, labels=adj_df.index.tolist())
    
    return analyzer


def analyze_all_weeks():
    """Analizza tutte le matrici di adiacenza settimanali."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    import glob
    pattern = os.path.join(script_dir, 'pingtime_AdjMatrix_settimana_*.csv')
    files = sorted(glob.glob(pattern))
    
    if not files:
        print("Nessuna matrice trovata.")
        return
    
    for filepath in files:
        filename = os.path.basename(filepath)
        settimana = filename.replace('pingtime_AdjMatrix_settimana_', '').replace('.csv', '')
        
        print(f"\n{'#'*60}")
        print(f"# SETTIMANA {settimana}")
        print(f"{'#'*60}")
        
        analyzer = analyze_adjacency_matrix(filepath)
        if analyzer:
            analyzer.print_analysis()


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Analizza una singola settimana
    csv_path = os.path.join(script_dir, 'pingtime_AdjMatrix_settimana_45.csv')
    
    if os.path.exists(csv_path):
        analyzer = analyze_adjacency_matrix(csv_path)
        analyzer.print_analysis()
    else:
        print("Esegui prima GenerateAdjMatrix.py per generare le matrici")
