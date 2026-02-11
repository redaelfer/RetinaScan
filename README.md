# RetinaScan - Diabetic Retinopathy Detection System 👁️

RetinaScan is a comprehensive medical platform integrating artificial intelligence to assist ophthalmologists in detecting and monitoring diabetic retinopathy from fundus images.

## 🏗️ Project Architecture

The project is divided into three main modules:

* **Backend (Java/Spring Boot)**: Manages authentication (JWT), user management, roles (DOCTOR, ADMIN), and analysis storage.
* **Frontend (React/Vite)**: A modern user interface featuring dashboards for doctors and global statistics.
* **AI Engine (Python/Flask)**: A dedicated service utilizing a Deep Learning model to analyze images and provide a diagnosis.

## 🛠️ Technologies Used

* **Frontend**: React, Vite, Lucide-react (icons).
* **Backend**: Spring Boot, Spring Security, JWT, Maven.
* **AI**: Flask, TensorFlow/Keras, Pandas, NumPy.
* **DevOps**: Docker, Docker-Compose.

## 📦 Installation and Deployment

### Using Docker

The project includes a `docker-compose.yaml` file to launch all services with a single command:

```bash
docker-compose up --build

```

### Manual Configuration

1. **Database**: Configure PostgreSQL or MySQL and update the credentials in the backend's `application.properties` file.
2. **JWT Key**: Define your `SECRET_KEY` for token security in the Spring configuration.
3. **AI Model**: Ensure the trained model is placed in the `retinascan-ai` folder to be loaded by Flask.

## 📊 Key Features

* **Secure Authentication**: Registration and login with role-based access control.
* **Doctor Dashboard**: Interface for uploading images and consulting past analysis results.
* **Statistics**: Data visualization of analysis results via a dedicated dashboard.
* **AI Training**: Python scripts included to retrain the model on new datasets.

## 📂 Folder Structure

* `/retinascan`: Java backend source code.
* `/frontend`: React interface source code.
* `/retinascan-ai`: Flask API and model training scripts.

---
