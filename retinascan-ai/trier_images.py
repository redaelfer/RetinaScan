import pandas as pd
import os
import shutil
from sklearn.model_selection import train_test_split

CSV_FILE = 'train.csv'          
SOURCE_DIR = 'dataset_raw'       
BASE_DIR = 'dataset'             
EXTENSION = '.png'              

CATEGORIES = {
    0: '0_sain',
    1: '1_leger',
    2: '2_modere',
    3: '3_severe',
    4: '4_proliferant'
}

for split in ['train', 'val']:
    for category_name in CATEGORIES.values():
        os.makedirs(os.path.join(BASE_DIR, split, category_name), exist_ok=True)

print("Chargement du CSV...")
df = pd.read_csv(CSV_FILE)

train_df, val_df = train_test_split(df, test_size=0.2, random_state=42)

def move_files(dataframe, split_name):
    print(f"Traitement du dossier {split_name}...")
    
    counts = {k: 0 for k in CATEGORIES.values()}
    
    for index, row in dataframe.iterrows():
        file_id = row['id_code']
        diagnosis = int(row['diagnosis']) 
        
        file_name = file_id + EXTENSION
        source_path = os.path.join(SOURCE_DIR, file_name)
        
        if diagnosis in CATEGORIES:
            category_folder = CATEGORIES[diagnosis]
            destination_path = os.path.join(BASE_DIR, split_name, category_folder, file_name)
            
            if os.path.exists(source_path):
                shutil.copy(source_path, destination_path)
                counts[category_folder] += 1
            else:
                pass
        else:
            print(f"Label inconnu pour {file_id}: {diagnosis}")

    print(f"--> Résumé {split_name} :")
    for cat, count in counts.items():
        print(f"   - {cat}: {count} images")


move_files(train_df, 'train')
move_files(val_df, 'val')

print("\nTri Multiclasse terminé avec succès")