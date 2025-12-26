from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.layers import Dense 
from PIL import Image
import numpy as np
import cv2 
import io

app = Flask(__name__)

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

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    try:
        image = Image.open(io.BytesIO(file.read()))
        processed_image = prepare_image(image, target_size=(224, 224))
        
        raw_prediction = model.predict(processed_image)
        raw_score = float(raw_prediction[0][0]) 

        probability = 1 / (1 + np.exp(-raw_score))
        
        if probability > 0.5:
            label = "Pathologie Détectée"
            confidence = probability
        else:
            label = "Œil Sain"
            confidence = 1.0 - probability
            
        return jsonify({
            "diagnosis": label,
            "confidence": round(confidence , 4) 
        })

    except Exception as e:
        print(f"Erreur Python : {e}")
        return jsonify({"error": "Processing error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)