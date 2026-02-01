# RetinaScan - Système de Détection de la Rétinopathie Diabétique 👁️

RetinaScan est une plateforme médicale complète intégrant l'intelligence artificielle pour aider les ophtalmologues à détecter et suivre la rétinopathie diabétique à partir d'images de fond d'œil.

##  Architecture du Projet

Le projet est divisé en trois modules principaux :

* **Backend (Java/Spring Boot)** : Gère l'authentification (JWT), la gestion des utilisateurs, des rôles (DOCTOR, ADMIN) et le stockage des analyses.
* **Frontend (React/Vite)** : Une interface utilisateur moderne avec des tableaux de bord pour les docteurs et des statistiques globales.
* **AI Engine (Python/Flask)** : Un service dédié qui utilise un modèle de Deep Learning pour analyser les images et fournir un diagnostic.

## 🛠️ Technologies utilisées

* **Frontend** : React, Vite, Lucide-react (icônes).
* **Backend** : Spring Boot, Spring Security, JWT, Maven.
* **IA** : Flask, TensorFlow/Keras, Pandas, NumPy.
* **DevOps** : Docker, Docker-Compose.

## 📦 Installation et Déploiement

### Utilisation de Docker

Le projet inclut un fichier `docker-compose.yaml` pour lancer tous les services en une seule commande :

```bash
docker-compose up --build

```

### Configuration manuelle

1. **Base de données** : Configurez PostgreSQL ou MySQL et mettez à jour les identifiants dans le fichier `application.properties` du backend.
2. **Clé JWT** : Définissez votre `SECRET_KEY` pour la sécurité des jetons dans la configuration Spring.
3. **Modèle IA** : Assurez-vous que le modèle entraîné est placé dans le dossier `retinascan-ai` pour être chargé par Flask.

## 📊 Fonctionnalités Clés

* **Authentification sécurisée** : Inscription et connexion avec gestion des rôles.
* **Dashboard Docteur** : Interface pour télécharger des images et consulter les résultats d'analyses passées.
* **Statistiques** : Visualisation des données d'analyses via un tableau de bord dédié.
* **Entraînement IA** : Scripts Python inclus pour ré-entraîner le modèle sur de nouveaux datasets.

## 📂 Structure des dossiers

* `/retinascan` : Code source du backend Java.
* `/frontend` : Code source de l'interface React.
* `/retinascan-ai` : API Flask et scripts d'entraînement du modèle.
