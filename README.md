# 🤖 Platforme InfoClub + AI Chatbot

Une plateforme unifiée regroupant le site web du club, le backend de gestion (MySQL) et un assistant intelligent (RAG Chatbot).

## 🚀 Guide de démarrage (Mode Hybride : Backend Local + DB Docker)

Ce mode est idéal pour le développement. Il utilise Docker pour la base de données (car votre MySQL local est peut-être capricieux) tout en faisant tourner le code Python directement sur votre machine.

### 1. Prérequis
- **Python 3.9+**
- **Docker & Docker Compose**
- **Clé API Gemini**

### 2. Lancer la Base de Données (Docker)
Depuis la racine du projet, lancez uniquement le service de base de données :
```bash
docker-compose up -d db
```
*Note: Cela crée la base de données et initialise toutes les tables automatiquement grâce au script `backend/init_db.sql`.*

### 3. Configurer le Backend
Allez dans le dossier `backend` et vérifiez votre fichier `.env` :
- `DB_HOST=127.0.0.1` (C'est l'adresse de votre Docker DB vue depuis votre machine)
- `GOOGLE_API_KEY="VOTRE_CLE_ICI"`

### 4. Lancer le Projet
#### Backend :
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```
#### Frontend :
Ouvrez simplement `frontend/index.html` dans votre navigateur.

---

## 🛠️ Commandes Utiles Docker
- **Voir les logs de la DB** : `docker logs -f infoclub_db`
- **Arrêter la DB** : `docker-compose stop db`
- **Tout réinitialiser (⚠️ supprime les données)** : `docker-compose down -v` puis `docker-compose up -d db`

## 📁 Structure du Projet
- `frontend/` : Interface utilisateur.
- `backend/` : API FastAPI, modèles SQLModel et logique IA.
- `backend/init_db.sql` : Script de création des tables.
- `docker-compose.yml` : Orchestration de la base de données.
