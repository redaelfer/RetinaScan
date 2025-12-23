import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
import matplotlib.pyplot as plt

IMG_SIZE = (224, 224)  
BATCH_SIZE = 32
EPOCHS = 10           
DATASET_DIR = 'dataset' 

train_datagen = ImageDataGenerator(
    rescale=1./255,        
    rotation_range=20,      
    zoom_range=0.15,        
    horizontal_flip=True,   
    fill_mode="nearest"
)

val_datagen = ImageDataGenerator(rescale=1./255)

print("Chargement des images...")
train_generator = train_datagen.flow_from_directory(
    f'{DATASET_DIR}/train',
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='binary' 
)

val_generator = val_datagen.flow_from_directory(
    f'{DATASET_DIR}/val',
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='binary'
)

base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation='relu')(x) 
x = Dropout(0.5)(x)                  
predictions = Dense(1, activation='sigmoid')(x) 

model = Model(inputs=base_model.input, outputs=predictions)

model.compile(optimizer=Adam(learning_rate=0.0001),
              loss='binary_crossentropy',
              metrics=['accuracy'])

print("Début de l'entraînement...")
history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=val_generator
)

model.save('retinascan_model.h5')
print("Modèle sauvegardé sous 'retinascan_model.h5' ! 🎉")

plt.plot(history.history['accuracy'], label='accuracy')
plt.plot(history.history['val_accuracy'], label = 'val_accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend(loc='lower right')
plt.savefig('training_plot.png')