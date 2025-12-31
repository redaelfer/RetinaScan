from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.layers import Dense 
from PIL import Image
import numpy as np
import cv2 
import io
from datetime import datetime

app = Flask(__name__)

CLASSES = {
    0: "Œil Sain (Niveau 0)",
    1: "Rétinopathie Légère (Niveau 1)",
    2: "Rétinopathie Modérée (Niveau 2)",
    3: "Rétinopathie Sévère (Niveau 3)",
    4: "Rétinopathie Proliférante (Niveau 4)"
}

class FixedDense(Dense):
    def __init__(self, *args, **kwargs):
        if 'quantization_config' in kwargs:
            kwargs.pop('quantization_config')
        super().__init__(*args, **kwargs)

print("Chargement du modèle IA...")
try:
    model = load_model('retinascan_model.h5', custom_objects={'Dense': FixedDense}, compile=False)
except:
    model = load_model('retinascan_model.h5', compile=False)
print("Modèle chargé !")

def prepare_image(image, target_size):
    if image.mode != "RGB":
        image = image.convert("RGB")
    
    img_array = np.array(image)
    
    lab_image = cv2.cvtColor(img_array, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab_image)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    final_img_array = cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)
    
    image = Image.fromarray(final_img_array)
    image = image.resize(target_size)
    image = img_to_array(image)
    image = np.expand_dims(image, axis=0)
    image = image / 255.0 
    return image

def calculate_trend(history):
    if not history or len(history) < 2:
        return "Stable (Données insuffisantes pour tendance)"
    
    recent = sorted(history, key=lambda x: x['date'])[-3:]
    levels = [x['severity_level'] for x in recent]
    
    if levels[-1] > levels[0]:
        return "AGGRAVATION RAPIDE ⚠️"
    elif levels[-1] < levels[0]:
        return "Amélioration notable ✅"
    elif levels[-1] == levels[0]:
        return "Stationnaire ➡️"
    return "Fluctuant"

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    try:
        image = Image.open(io.BytesIO(file.read()))
        processed_image = prepare_image(image, target_size=(224, 224))
        
        predictions = model.predict(processed_image)
        probs = predictions[0] 
        
        class_idx = np.argmax(probs)
        confidence = float(probs[class_idx])
        
        label = CLASSES.get(class_idx, "Inconnu")

        details = {
            "sain": float(probs[0]),
            "leger": float(probs[1]),
            "modere": float(probs[2]),
            "severe": float(probs[3]),
            "proliferant": float(probs[4])
        }

        return jsonify({
            "diagnosis": label,
            "confidence": round(confidence, 4),
            "details": details 
        })

    except Exception as e:
        print(f"Erreur Python : {e}")
        return jsonify({"error": "Processing error"}), 500

@app.route('/analyze-case', methods=['POST'])
def analyze_case():
    data = request.json
    
    current_scan = data.get('current')
    history = data.get('history', [])
    patient_name = data.get('patientName')
    
    trend = calculate_trend(history)
    
    severity_level = current_scan.get('severity_level', 0)
    risk_factor = "FAIBLE"
    if severity_level >= 3: risk_factor = "CRITIQUE"
    elif severity_level == 2: risk_factor = "MODÉRÉ"
    
    
    report = f"--- ANALYSE AUTOMATISÉE ---\n"
    report += f"Patient : {patient_name}\n"
    report += f"Date : {datetime.now().strftime('%d/%m/%Y')}\n\n"
    
    report += f"1. ÉTAT ACTUEL :\n"
    report += f"- Diagnostic : {current_scan['prediction']} (Confiance: {int(current_scan['confidence']*100)}%)\n"
    report += f"- Symptômes rapportés : {current_scan['symptoms']}\n\n"
    
    report += f"2. DYNAMIQUE ÉVOLUTIVE :\n"
    report += f"- Tendance sur les derniers examens : {trend}\n"
    if trend == "AGGRAVATION RAPIDE ⚠️":
        report += "ALERTE : Le patient présente une dégradation par rapport au scan précédent. Vérifier l'observance du traitement.\n"
    elif trend == "Amélioration notable ✅":
        report += "NOTE : Réponse positive au protocole actuel.\n"
        
    report += f"\n3. RECOMMANDATION SUGGÉRÉE AU MÉDECIN :\n"
    
    if severity_level == 0:
        report += "-> Maintien du dépistage annuel. Pas d'intervention requise."
    elif severity_level == 1:
        report += "-> Renforcer le contrôle glycémique. Nouveau contrôle dans 6 mois."
    elif severity_level == 2:
        report += "-> Envisager une angiographie à la fluorescéine. Contrôle rapproché (3 mois)."
    elif severity_level >= 3:
        report += "-> URGENCE : Protocole thérapeutique requis (Laser/IVT). Référer à un spécialiste rétine immédiatement."
        
    return jsonify({"report": report})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)