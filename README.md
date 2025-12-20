<div align="center">

# 🎨 Artifex
### AI-Powered Creative Studio for Image & Video Generation

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.0-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue?style=for-the-badge&logo=docker)](https://www.docker.com/)

</div>

---

## 📸 Screenshots


<div align="center">
<img width="1280" height="671" alt="artifex landing" src="https://github.com/user-attachments/assets/8a34101e-7cc7-4738-a8a4-5790de018f1f" />
  <br/>
  <em>Advanced Image Generation Studio</em>
</div>
<div align="center">

  <img width="1280" height="669" alt="dashboard" src="https://github.com/user-attachments/assets/d781f596-9263-4510-a8db-e8c1ce6611ba" />
  <br/>
  <em>Interactive AI Dashboard</em>
</div>

<br/>




---

## 👨‍💻 About the Developer
Hi, I'm **Naman** — a Full-Stack Developer with strong experience in modern web development and building production-ready apps.
If you're a recruiter or collaborator, feel free to reach out:

🌐 **Portfolio:** [namannayak.me](https://namannayak.me)  
💼 **LinkedIn:** [linkedin.com/in/naman-nayak14](https://www.linkedin.com/in/naman-nayak14/)  

---

## 🧠 Features

- **🎨 AI Image Generation:** Create stunning visuals from text prompts using advanced models (Gemini/Stable Diffusion integration).
- **🎥 Video Generation:** Transform ideas into motion with AI-powered video synthesis.
- **💬 Intelligent Chat:** Context-aware AI chat interface for brainstorming and assistance.
- **🔐 Secure Authentication:** Robust user management powered by Clerk.
- **💳 Subscription System:** Tiered access control and quota management.
- **⚡ Real-time Processing:** Optimized backend for fast generation and response times.
- **📱 Responsive Design:** Beautiful, mobile-first UI built with TailwindCSS and Framer Motion.
- **☁️ Cloud Storage:** Seamless media management with Cloudinary.

---

## 📦 Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS, Shadcn UI, Framer Motion
- **State/Auth:** Clerk, React Hooks
- **AI Integration:** Vercel AI SDK

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **AI Models:** Google Gemini, Custom Integrations
- **Media:** Cloudinary, Sharp
- **Tools:** Docker, Node-Cron

---

## 🛠 Installation & Setup

Follow these steps to get the project running locally.

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (optional, for containerized setup)
- MongoDB (local or Atlas URI)
- Cloudinary Account
- Clerk Account

### 1. Clone the Repository
```bash
git clone https://github.com/Namann-14/artifex.git
cd artifex
```

### 2. Environment Setup
Create `.env` files in both `backend` and `frontend` directories based on the examples below.

**Backend (`backend/.env`):**
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_key
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Run with Docker (Recommended)
The easiest way to start the entire stack.
```bash
docker-compose up --build
```

### 4. Manual Setup (Alternative)

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to view the application.

---

## 🧪 Running Tests

To run the test suite (if configured):

```bash
# Backend tests
cd backend
npm test
```

---

## 🧗‍♂️ Folder Structure

```
artifex/
├── backend/                 # Express.js API Server
│   ├── src/
│   │   ├── config/         # Database & Env Config
│   │   ├── controllers/    # Route Controllers
│   │   ├── middleware/     # Auth & Validation Middleware
│   │   ├── models/         # Mongoose Models
│   │   ├── routes/         # API Routes
│   │   └── services/       # Business Logic (AI, Cloudinary)
│   └── Dockerfile
├── frontend/                # Next.js Client
│   ├── src/
│   │   ├── app/            # App Router Pages
│   │   ├── components/     # React Components
│   │   ├── lib/            # Utilities & API Clients
│   │   └── hooks/          # Custom Hooks
│   └── Dockerfile
├── docker-compose.yml       # Container Orchestration
└── README.md               # Project Documentation
```

---

## 🛣 Roadmap

- [x] Project Initialization & Architecture
- [x] Authentication System (Clerk)
- [x] Image Generation Pipeline
- [x] Video Generation Pipeline
- [ ] User Gallery & Social Features
- [ ] Advanced Image Editing Tools
- [ ] Mobile Application (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ⭐ Support

If you find this project useful, please give it a **Star**! ⭐️

It helps others find the project and motivates further development.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
