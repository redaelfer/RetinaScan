import pandas as pd
import os
import shutil
from sklearn.model_selection import train_test_split

CSV_FILE = 'train.csv'          
SOURCE_DIR = 'dataset_raw'       
BASE_DIR = 'dataset'             
EXTENSION = '.png'              

for split in ['train', 'val']:
    for category in ['sain', 'malade']:
        os.makedirs(os.path.join(BASE_DIR, split, category), exist_ok=True)

print("Chargement du CSV...")
df = pd.read_csv(CSV_FILE)

train_df, val_df = train_test_split(df, test_size=0.2, random_state=42)

def move_files(dataframe, split_name):
    print(f"Traitement du dossier {split_name}...")
    count_sain = 0
    count_malade = 0
    
    for index, row in dataframe.iterrows():
        file_id = row['id_code'] 
        diagnosis = row['diagnosis'] 
        
        file_name = file_id + EXTENSION
        source_path = os.path.join(SOURCE_DIR, file_name)
        
        if diagnosis == 0:
            category = 'sain'
            count_sain += 1
        else:
            category = 'malade'
            count_malade += 1
            
        destination_path = os.path.join(BASE_DIR, split_name, category, file_name)
        
        if os.path.exists(source_path):
            shutil.copy(source_path, destination_path)
        else:
            pass
            
    print(f"--> Fini pour {split_name} : {count_sain} Sains, {count_malade} Malades copiés.")

move_files(train_df, 'train')
move_files(val_df, 'val')

print("\nTri terminé avec succès ")