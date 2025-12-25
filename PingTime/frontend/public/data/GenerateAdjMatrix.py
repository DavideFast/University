import pandas as pd
import numpy as np
from itertools import combinations
import os
import matplotlib.pyplot as plt
import seaborn as sns

def generate_adjacency_matrix():
    """
    Genera matrici di adiacenza che mostrano quante volte due persone
    hanno giocato insieme durante una settimana.
    
    Due persone "hanno giocato insieme" se hanno giocato nella stessa 
    settimana, stessa fascia oraria e stesso gruppo (entrambi con effettivo = 1).
    
    - Diagonale: 0
    - Cella [i,j]: numero di volte che i e j hanno giocato insieme nella settimana
    """
    
    # Percorso della directory corrente
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Leggi i dati delle persone
    persone_path = os.path.join(script_dir, 'pingtime_Persona.csv')
    persone_df = pd.read_csv(persone_path)
    
    # Lista di tutti gli alias delle persone
    all_aliases = sorted(persone_df['alias'].unique().tolist())
    n_persone = len(all_aliases)
    
    # Crea un dizionario per mappare alias -> indice
    alias_to_idx = {alias: idx for idx, alias in enumerate(all_aliases)}
    
    # Leggi i dati del calendario
    calendario_path = os.path.join(script_dir, 'pingtime_Calendario.csv')
    calendario_df = pd.read_csv(calendario_path)
    
    # Filtra solo le righe dove la persona ha effettivamente giocato (effettivo = 1)
    calendario_df = calendario_df[calendario_df['effettivo'] == 1]
    
    # Ottieni tutte le settimane presenti nei dati
    settimane = sorted(calendario_df['settimana'].unique())
    
    print(f"Trovate {len(settimane)} settimane: {settimane}")
    print(f"Numero di persone: {n_persone}")
    
    # Per ogni settimana, genera una matrice di adiacenza
    for settimana in settimane:
        print(f"\nProcessando settimana {settimana}...")
        
        # Filtra i dati per questa settimana
        week_data = calendario_df[calendario_df['settimana'] == settimana]
        
        # Inizializza la matrice di adiacenza a zero
        adj_matrix = np.zeros((n_persone, n_persone), dtype=int)
        
        # Per ogni combinazione di fascia oraria e gruppo, trova le persone che hanno giocato insieme
        for (fascia, gruppo), group_data in week_data.groupby(['fascia_oraria', 'gruppo']):
            # Persone che hanno giocato in questa fascia oraria e gruppo
            persone_gruppo = group_data['alias'].tolist()
            
            # Per ogni coppia di persone nello stesso gruppo e fascia, incrementa il contatore
            if len(persone_gruppo) >= 2:
                for p1, p2 in combinations(persone_gruppo, 2):
                    if p1 in alias_to_idx and p2 in alias_to_idx:
                        idx1 = alias_to_idx[p1]
                        idx2 = alias_to_idx[p2]
                        adj_matrix[idx1, idx2] += 1
                        adj_matrix[idx2, idx1] += 1
        
        # Diagonale a 0 (già inizializzata a 0)
        
        # Crea il DataFrame con la matrice di adiacenza
        adj_df = pd.DataFrame(adj_matrix, index=all_aliases, columns=all_aliases)
        
        # Salva il file CSV
        output_filename = f'pingtime_AdjMatrix_settimana_{settimana}.csv'
        output_path = os.path.join(script_dir, output_filename)
        adj_df.to_csv(output_path, index=True)
        
        # Statistiche
        total_connections = np.sum(adj_matrix) // 2
        max_connections = np.max(adj_matrix)
        
        print(f"  - File salvato: {output_filename}")
        print(f"  - Coppie che hanno giocato insieme: {total_connections}")
        print(f"  - Max partite insieme tra due persone: {max_connections}")
    
    print("\n✓ Generazione completata!")
    return settimane


def visualize_heatmap(settimana):
    """
    Visualizza la matrice di adiacenza di una settimana come heatmap.
    
    Args:
        settimana: numero della settimana da visualizzare
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    filename = f'pingtime_AdjMatrix_settimana_{settimana}.csv'
    filepath = os.path.join(script_dir, filename)
    
    if not os.path.exists(filepath):
        print(f"File non trovato: {filename}")
        print("Esegui prima generate_adjacency_matrix()")
        return
    
    # Leggi la matrice
    adj_df = pd.read_csv(filepath, index_col=0)
    
    # Crea la figura
    plt.figure(figsize=(14, 12))
    
    # Crea la heatmap
    sns.heatmap(
        adj_df,
        annot=False,  # Non mostrare i numeri (troppi)
        cmap='YlOrRd',  # Colormap: giallo -> arancione -> rosso
        square=True,
        linewidths=0.5,
        cbar_kws={'label': 'Partite giocate insieme'}
    )
    
    plt.title(f'Matrice di Adiacenza - Settimana {settimana}\n(Partite giocate insieme)', fontsize=14)
    plt.xlabel('Giocatore')
    plt.ylabel('Giocatore')
    
    # Ruota le etichette per leggibilità
    plt.xticks(rotation=45, ha='right', fontsize=6)
    plt.yticks(rotation=0, fontsize=6)
    
    plt.tight_layout()
    
    # Salva l'immagine
    output_filename = f'heatmap_settimana_{settimana}.png'
    output_path = os.path.join(script_dir, output_filename)
    plt.savefig(output_path, dpi=150)
    print(f"Heatmap salvata: {output_filename}")
    
    # Mostra la figura
    plt.show()


def visualize_all_heatmaps():
    """
    Visualizza le heatmap di tutte le settimane disponibili.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Trova tutti i file delle matrici
    import glob
    pattern = os.path.join(script_dir, 'pingtime_AdjMatrix_settimana_*.csv')
    files = glob.glob(pattern)
    
    if not files:
        print("Nessuna matrice trovata. Esegui prima generate_adjacency_matrix()")
        return
    
    # Estrai i numeri delle settimane
    settimane = []
    for f in files:
        basename = os.path.basename(f)
        # Estrai il numero della settimana dal nome del file
        num = basename.replace('pingtime_AdjMatrix_settimana_', '').replace('.csv', '')
        settimane.append(int(num))
    
    settimane.sort()
    
    for settimana in settimane:
        visualize_heatmap(settimana)


def heatmap_from_csv(csv_path):
    """
    Stampa una heatmap a partire da un file CSV contenente una matrice di adiacenza.
    
    Args:
        csv_path: percorso del file CSV
    """
    if not os.path.exists(csv_path):
        print(f"File non trovato: {csv_path}")
        return
    
    # Leggi la matrice
    adj_df = pd.read_csv(csv_path, index_col=0)
    
    # Crea la figura
    plt.figure(figsize=(14, 12))
    
    # Crea la heatmap
    sns.heatmap(
        adj_df,
        annot=True,  # Mostra i numeri nelle celle
        fmt='d',     # Formato intero
        cmap='YlOrRd',
        square=True,
        linewidths=0.5,
        cbar_kws={'label': 'Partite giocate insieme'}
    )
    
    # Estrai il nome del file per il titolo
    filename = os.path.basename(csv_path)
    plt.title(f'Heatmap - {filename}', fontsize=14)
    plt.xlabel('Giocatore')
    plt.ylabel('Giocatore')
    
    # Ruota le etichette per leggibilità
    plt.xticks(rotation=45, ha='right', fontsize=7)
    plt.yticks(rotation=0, fontsize=7)
    
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    # Esempio: stampa heatmap da un CSV
    script_dir = os.path.dirname(os.path.abspath(__file__))
    #heatmap_from_csv(script_dir + '/pingtime_AdjMatrix_settimana_44.csv')
    generate_adjacency_matrix()
    visualize_all_heatmaps()
    pass
