# 🚀 Lumen — AI PDF Chat Assistant

A full-stack **RAG-powered PDF chatbot** with streaming responses, Firebase authentication, and persistent chat history.

---

## 🧠 Features

* 📄 Upload and chat with PDFs
* ⚡ Real-time streaming responses
* 🔐 Firebase Authentication
* 💾 Persistent chat history
* ☁️ Cloudinary avatar uploads
* 🧠 Powered by Gemini + Groq + Pinecone

---

## 🏗️ Project Structure

```
lumen/
├── server/   # Node.js + Express backend
├── client/   # React + Vite frontend
```

---

## ⚙️ Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB
* Pinecone
* LangChain
* Firebase Admin SDK
* Gemini API
* Groq API

### Frontend

* React
* Vite
* Tailwind CSS
* Framer Motion
* Firebase Auth

---

## 🚀 Quick Start

### 1️⃣ Server Setup

```bash
cd server
cp .env.example .env
# Fill in your API keys
npm install
node server.js
```

---

### 2️⃣ Client Setup

```bash
cd client
cp env.example .env
# Fill Firebase keys
npm install
npm run dev
```

---

### 🌐 Open App

👉 lumen-ai-one.vercel.app

---

## 🔑 Environment Variables

### 📁 server/.env

```
MONGO_URI=
GEMINI_API_KEY=
GROQ_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX_NAME=
FIREBASE_SERVICE_ACCOUNT_PATH=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

### 📁 client/.env

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## 📌 Notes

* Make sure MongoDB is running
* Firebase service account JSON path must be correct
* Pinecone index dimension should match embeddings (e.g., 2048)

---

## 💡 Future Improvements

* 🧾 Multi-PDF querying
* 🌍 Deployment (Vercel + Render)
* 🧠 Better embeddings
* 📊 Usage analytics

---

## 👨‍💻 Author

**Harsh Kumar Yadav**

---

## ⭐ LUMEN-AI
