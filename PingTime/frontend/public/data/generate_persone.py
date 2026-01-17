import pandas as pd
import numpy as np

# ==========================================
# CONFIGURATION
# ==========================================
INPUT_FILENAME = 'public/data/pingtime_Calendario.csv'
OUTPUT_FILENAME = 'public/data/pingtime_Persona.csv'

# Distribuzione delle priorità [NO FONTE]
# Simuliamo una distribuzione realistica (Pareto principle): 
# La maggior parte sono "Normale", pochi "Alta", pochissimi "Molto Alta".
PRIORITY_OPTIONS = ['Normale', 'Alta', 'Molto Alta']
PRIORITY_WEIGHTS = [0.70, 0.20, 0.10] 

def generate_persona_file():
    print(f"Lettura del file sorgente: {INPUT_FILENAME}...")
    
    try:
        # 1. Caricamento del Calendario
        df_calendar = pd.read_csv(INPUT_FILENAME)
        
        # Verifica esistenza colonne necessarie
        required_cols = ['alias', 'gruppo']
        if not all(col in df_calendar.columns for col in required_cols):
            raise ValueError(f"Il file input deve contenere le colonne: {required_cols}")

        # 2. Estrazione Utenti Unici e Gruppi
        # Raggruppiamo per alias e prendiamo il primo valore di 'gruppo' trovato.
        # Assumiamo che un alias appartenga sempre allo stesso gruppo nel calendario.
        print("Estrazione degli alias univoci e associazione gruppi...")
        df_persona = df_calendar[['alias', 'gruppo']].drop_duplicates(subset=['alias']).copy()
        
        # Rinomina colonna per matchare le specifiche (alias -> Alias, gruppo -> Gruppo)
        df_persona = df_persona.rename(columns={'alias': 'Alias', 'gruppo': 'Gruppo'})
        
        # 3. Assegnazione Priorità Casuale
        print("Assegnazione priorità casuali...")
        # Utilizziamo numpy.random.choice per l'assegnazione pesata
        df_persona['Priorità'] = np.random.choice(
            PRIORITY_OPTIONS, 
            size=len(df_persona), 
            p=PRIORITY_WEIGHTS
        )

        # 4. Riordino Colonne ed Esportazione
        # Ordine richiesto: Alias, Priorità, Gruppo
        df_persona = df_persona[['Alias', 'Priorità', 'Gruppo']]
        
        print(f"Esportazione di {len(df_persona)} utenti in {OUTPUT_FILENAME}...")
        df_persona.to_csv(OUTPUT_FILENAME, index=False)
        
        print("Generazione completata con successo.")
        
        # Mostra un'anteprima
        print("\nAnteprima del file generato:")
        print(df_persona.head())

    except FileNotFoundError:
        print(f"Errore: Il file '{INPUT_FILENAME}' non è stato trovato nella directory corrente.")
    except Exception as e:
        print(f"Si è verificato un errore imprevisto: {e}")

if __name__ == "__main__":
    generate_persona_file()