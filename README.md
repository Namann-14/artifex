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

### Core Capabilities

- **🎨 AI Image Generation**
  - Multi-model support (Gemini AI, Freepik API integration)
  - Advanced prompt engineering and optimization
  - Real-time generation progress tracking via WebSockets
  - Batch processing for multiple variations
  - Image-to-image transformation support
  - Customizable aspect ratios and quality settings
  - Smart caching for faster regeneration

- **🎥 Video Generation**
  - Text-to-video synthesis using AI models
  - Customizable video parameters (duration, resolution, frame rate)
  - Progress tracking and queue management
  - Background processing for large videos
  - Export in multiple formats (MP4, WebM)

- **💬 Intelligent Chat Interface**
  - Context-aware conversations powered by Vercel AI SDK
  - Multi-turn dialogue with memory
  - Code block syntax highlighting
  - Markdown rendering support
  - Streaming responses for real-time interaction
  - Artifact generation and branching

- **🔐 Enterprise-Grade Authentication**
  - Secure user management via Clerk
  - OAuth support (Google, GitHub, etc.)
  - Session management and JWT tokens
  - Role-based access control (RBAC)
  - Protected API routes with middleware

- **💳 Flexible Subscription System**
  - Multiple subscription tiers (Free, Pro, Enterprise)
  - Usage quota tracking and enforcement
  - Automatic quota reset on renewal
  - Grace period handling
  - Webhook integration for payment events

- **⚡ High-Performance Backend**
  - Job queue system with Redis
  - Background task processing
  - Rate limiting and request throttling
  - Optimized database queries with indexing
  - Caching strategies for frequently accessed data
  - Error handling and retry mechanisms

- **📱 Modern User Interface**
  - Fully responsive design (mobile, tablet, desktop)
  - Dark/light theme support
  - Smooth animations with Framer Motion
  - Accessible UI components (ARIA compliant)
  - Drag-and-drop file upload
  - Real-time status updates

- **☁️ Cloud Infrastructure**
  - Cloudinary integration for media storage
  - Automatic image optimization and transformation
  - CDN delivery for fast asset loading
  - Secure upload with signed URLs
  - Backup and redundancy

---

## 📦 Tech Stack

### Frontend
- **Framework:** Next.js 15.0 (App Router, React Server Components)
- **Language:** TypeScript 5.0
- **UI Library:** React 19.0
- **Styling:** 
  - TailwindCSS 3.4
  - Shadcn UI Components
  - Framer Motion (animations)
  - Radix UI (accessible primitives)
- **State Management:** React Hooks, Context API
- **Authentication:** Clerk (OAuth, JWT)
- **AI Integration:** Vercel AI SDK
- **HTTP Client:** Axios
- **Form Handling:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Utilities:** clsx, tailwind-merge

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js 4.x
- **Language:** TypeScript
- **Database:** 
  - MongoDB (primary database)
  - Mongoose ODM
  - Database indexing and optimization
- **Caching & Queue:** Redis (job queue, WebSocket pub/sub)
- **AI/ML Services:**
  - Google Gemini API (image generation, chat)
  - Freepik API (image generation)
  - Custom AI orchestration layer
- **Media Processing:**
  - Cloudinary (storage, CDN, transformations)
  - Sharp (image processing)
  - FFmpeg (video processing)
- **Real-time Communication:** 

Create `.env` files in both `backend` and `frontend` directories based on the templates below.

#### Backend Environment Variables (`backend/.env`)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/artifex
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/artifex?retryWrites=true&w=majority

# Redis (for job queue and WebSocket)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication (Clerk)
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Cloud Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=artifex_uploads

# AI Services
GEMINI_API_KEY=your_gemini_api_key
FREEPIK_API_KEY=your_freepik_api_key

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session & Security
SESSION_SECRET=your_random_session_secret
JWT_SECRET=your_jwt_secret

# Logging
LOG_LEVEL=debug
```

#### Frontend Environment Variables (`frontend/.env.local`)

```envInstall Dependencies

#### Using Docker (Recommended)
The easiest way to start the entire stack with all dependencies.

```bash
# Start all services (MongoDB, Redis, Backend, Frontend)
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

Access the application:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- API Health Check: `http://localhost:5000/api/health`
🏗 Architecture Overview

### System Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Next.js   │────────▶│   Express    │────────▶│   MongoDB   │
│  Frontend   │         │   Backend    │         │  Database   │
│  (Port 3000)│         │  (Port 5000) │         └─────────────┘
└─────────────┘         └──────────────┘                │
       │                       │                         │
       │                       ▼                         │
   📁 Detailed Folder Structure

```
artifex/
├── backend/                          # Express.js API Server
│   ├── src/
│   │   ├── app.ts                   # Express app configuration
│   │   ├── server.ts                # Server entry point
│   │   ├── config/
│   │   │   ├── database.ts          # MongoDB connection setup
│   │   │   ├── env.ts               # Environment variables validation
│   │   │   └── redis.ts             # Redis client configuration
│   │   ├── controllers/
│   │   │   ├── imageGeneration.ts   # Image generation endpoints
│   │   │   └── videoGeneration.ts   # Video generation endpoints
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT/Clerk authentication
│   │   │   ├── errorHandler.ts      # Global error handling
│   │   │   ├── imageGeneration.ts   # Generation-specific middleware
│   │   │   ├── quota.ts             # Usage quota enforcement
│   │   │   ├── subscription.ts      # Subscription validation
│   │   │   └── validation.ts        # Request validation (Zod)
│   │   ├── models/
│   │   │   ├── base.ts              # Base model with timestamps
│   │   │   ├── ImageGeneration.ts   # Image generation schema
│   │   │   ├── Subscription.ts      # Subscription schema
│   │   │   ├── User.ts              # User schema
│   │   │   └── index.ts             # Model exports
### ✅ Completed
- [x] Project Architecture & Setup
- [x] Docker Containerization
- [x] MongoDB Database Integration
- [x] Redis Job Queue System
- [x] Clerk Authentication (OAuth, JWT)
- [x] User Registration & Profile Management
- [x] Subscription & Quota System
- [x] AI Image Generation (Gemini & Freepik)
- [x] Real-time WebSocket Communication
- [x] Cloudinary CDN Integration
- [x] Video Generation Pipeline
- [x] Interactive AI Chat and appreciated! Whether it's bug fixes, new features, documentation improvements, or suggestions, feel free to contribute.

### How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/artifex.git
   cd artifex
   ```

2. 💡 FAQ

**Q: Is this project free to use?**
A: Yes, the codebase is open-source under MIT license. However, you'll need your own API keys for services (Clerk, Cloudinary, Gemini, etc.).

**Q: Can I use this for commercial projects?**
A: Yes, the MIT license allows commercial use. Just make sure to comply with the licenses of third-party services you use.

**Q: How much does it cost to run?**
A: Free tier options are available for most services:
- MongoDB Atlas: 512MB free
- Clerk: 5,000 MAUs free
- Cloudinary: 25GB storage + 25GB bandwidth free
- Gemini API: Rate-limited free tier
- Vercel/Railway: Generous free tiers

**Q: Can I self-host everything?**
A: Yes, you can run MongoDB and Redis locally. For AI models, you'd need API keys or local model alternatives.

**Q: What image models are supported?**
A: Currently Gemini and Freepik APIs. The architecture allows easy addition of other providers (Stable Diffusion, DALL-E, etc.).

**Q: How do I report bugs?**
A: Open an issue on GitHub with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details

**Q: Can I use a different database?**
A: The code uses Mongoose (MongoDB), but you could adapt it to PostgreSQL/MySQL with some refactoring.

---

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Vercel** - For AI SDK and hosting platform
- **Clerk** - For seamless authentication
- **Cloudinary** - For media management
- **Google** - For Gemini AI API
- **Shadcn** - For beautiful UI components
- **Open Source Community** - For countless libraries used

---

## ⭐ Support

If you find this project useful, please consider:
- Giving it a **Star** ⭐ on GitHub
- Sharing it with others who might benefit
- Contributing improvements or features
- Reporting bugs and suggesting enhancements

Your support helps motivate continued development and improvement!

---

## 📞 Contact & Support

**Developer:** Naman Nayak
- 🌐 Portfolio: [namannayak.me](https://namannayak.me)
- 💼 LinkedIn: [linkedin.com/in/naman-nayak14](https://www.linkedin.com/in/naman-nayak14/)
- 📧 Email: Available on portfolio
- 🐛 Issues: [GitHub Issues](https://github.com/Namann-14/artifex/issues)

**For:**
- Job opportunities and collaborations
- Technical questions about the project
- Feature requests and suggestions
- Bug reports and issues

---

## 📝 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Naman Nayak

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

See the [LICENSE](LICENSE) file for full details.

---

<div align="center">

**Made with ❤️ by [Naman Nayak](https://namannayak.me)**

If this project helped you, please ⭐ star it on GitHub!

[Report Bug](https://github.com/Namann-14/artifex/issues) · [Request Feature](https://github.com/Namann-14/artifex/issues) · [Documentation](https://github.com/Namann-14/artifex/wiki)

</div>
   - Update documentation if needed

4. **Test Your Changes**
   ```bash
   # Backend tests
   cd backend
   npm test
   
   # Frontend tests
   cd frontend
   npm test
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m 'feat: Add some AmazingFeature'
   
   # Follow conventional commits:
   # feat: New feature
   # fix: Bug fix
   # docs: Documentation changes
   # style: Code style changes (formatting, etc.)
   # refactor: Code refactoring
   # test: Adding tests
   # chore: Maintenance tasks
   ```

6. **Push to Your Fork**
   ```bash
   git push origin feature/AmazingFeature
   ```

7. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your feature branch
   - Provide a clear description of changes
   - Link any related issues

### Contribution Guidelines

**Code Style:**
- Use TypeScript for all new code
- Follow ESLint rules (run `npm run lint`)
- Use meaningful variable and function names
- Write self-documenting code with comments when needed

**Commit Messages:**
- Use conventional commits format
- Be descriptive but concise
- Reference issue numbers when applicable

**Pull Request Best Practices:**
- Keep PRs focused on a single feature/fix
- Include screenshots for UI changes
- Update relevant documentation
- Ensure all tests pass
- Request review from maintainers

### Areas We Need Help

- 🐛 Bug fixes and error handling improvements
- 📝 Documentation and tutorials
- 🎨 UI/UX enhancements
- ✅ Writing tests (unit, integration, e2e)
- 🌐 Internationalization (i18n)
- ♿ Accessibility improvements
- 🚀 Performance optimizations
- 📱 Mobile responsiveness

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on collaboration and learning
- Help others when possiblediting Tools
  - Image upscaling
  - Style transfer
  - Inpainting/outpainting
  - Background removal
- [ ] Enhanced Video Features
  - Longer video generation
  - Custom transitions
  - Audio integration
- [ ] Social Features
  - Public gallery
  - User profiles
  - Like & comment system
  - Share to social media

### 📋 Planned
- [ ] **Mobile Experience**
  - Progressive Web App (PWA)
  - React Native mobile app
  - Offline mode support
  
- [ ] **Advanced AI Features**
  - Multi-model comparison
  - Custom model training
  - Style presets library
  - Prompt templates
  - Batch processing UI
  
- [ ] **Collaboration**
  - Team workspaces
  - Shared projects
  - Comment threads
  - Version history
  
- [ ] **API & Integrations**
  - Public REST API
  - Zapier integration
  - WordPress plugin
  - Figma plugin
  
- [ ] **Enterprise Features**
  - SSO integration
  - Custom branding
  - Usage analytics dashboard
  - Admin panel
  - Audit logs
  
- [ ] **Performance**
  - Edge function deployment
  - Advanced caching strategies
  - CDN optimization
  - Database sharding

### 🎯 Future Ideas
- AI-powered prompt suggestions
- 3D model generation
- Audio generation
- Animation creation
- Brand kit management
- Template marketplace
- API rate limiting tiers
- Referral program
│   │   │   ├── cloudinaryService.ts         # Cloudinary integration
│   │   │   ├── freepikService.ts            # Freepik API client
│   │   │   ├── geminiService.ts             # Google Gemini API
│   │   │   ├── imageGenerationOrchestrator.ts # Generation workflow
│   │   │   ├── imageProcessingService.ts    # Image manipulation
│   │   │   ├── jobQueue.ts                  # Redis job queue
│   │   │   ├── videoGenerationService.ts    # Video processing
│   │   │   └── websocketService.ts          # WebSocket management
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript type definitions
│   │   ├── utils/
│   │   │   ├── asyncHandler.ts      # Async error wrapper
│   │   │   ├── auth.ts              # Auth helper functions
│   │   │   ├── base64Utils.ts       # Base64 encoding/decoding
│   │   │   ├── database.ts          # Database utilities
│   │   │   ├── fileHandler.ts       # File operations
│   │   │   ├── imageGenerationErrors.ts # Custom error classes
│   │   │   ├── logger.ts            # Winston logger setup
│   │   │   ├── quota.ts             # Quota calculation
│   │   │   ├── scheduledTasks.ts    # Cron jobs
│   │   │   └── subscription.ts      # Subscription helpers
│   │   └── validation/
│   │       └── imageGeneration.ts   # Zod validation schemas
│   ├── public/
│   │   └── temp/                    # Temporary file storage
│   ├── uploads/                     # User uploads directory
│   ├── Dockerfile                   # Backend Docker config
│   ├── package.json                 # Backend dependencies
│   ├── tsconfig.json                # TypeScript configuration
│   └── README.md                    # Backend documentation
│
├── frontend/                        # Next.js Client
│   ├── src/
│   │   ├── app/                     # Next.js 15 App Router
│   │   │   ├── globals.css          # Global styles
│   │   │   ├── layout.tsx           # Root layout
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── chat/
│   │   │   │   └── page.tsx         # AI chat interface
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         # User dashboard
│   │   │   ├── gallery/
│   │   │   │   └── page.tsx         # Generated images gallery
│   │   │   ├── profile/
│   │   │   │   └── [[...profile]]   # User profile (Clerk)
│   │   │   ├── sign-in/
│   │   │   │   └── [[...sign-in]]   # Sign in page (Clerk)
│   │   │   ├── sign-up/
│   │   │   │   └── [[...sign-up]]   # Sign up page (Clerk)
│   │   │   └── video/
│   │   │       └── page.tsx         # Video generation page
│   │   ├── components/
│   │   │   ├── theme-toggle.tsx     # Dark/light mode toggle
│   │   │   ├── ai-elements/         # AI-specific components
│   │   │   │   ├── actions.tsx      # AI action buttons
│   │   │   │   ├── artifact.tsx     # Generated artifacts
│   │   │   │   ├── branch.tsx       # Conversation branches
│   │   │   │   ├── chain-of-thought.tsx # Reasoning display
│   │   │   │   ├── code-block.tsx   # Syntax-highlighted code
│   │   │   │   ├── conversation.tsx # Chat conversation
│   │   │   │   ├── image.tsx        # Generated image display
│   │   │   │   ├── message.tsx      # Chat message component
│   │   │   │   └── loader.tsx       # Loading animations
│   │   │   ├── auth/                # Authentication components
│   │   │   ├── generation/          # Image/video generation UI
│   │   │   ├── landing/             # Landing page sections
│   │   │   ├── providers/           # Context providers
│   │   │   └── ui/                  # Shadcn UI components
│   │   ├── hooks/
│   │   │   ├── use-generation-socket.ts # WebSocket hook
│   │   │   ├── use-mobile.tsx       # Mobile detection
│   │   │   └── use-toast.ts         # Toast notifications
│   │   ├── lib/
│   │   │   ├── animations.ts        # Framer Motion variants
│   │   │   ├── api-client.ts        # Axios instance
│   │   │   ├── auth.ts              # Clerk configuration
│   │   │   ├── cloudinary.ts        # Cloudinary helpers
│   │   │   └── utils.ts             # General utilities
│   │   └── types/
│   │       └── global.d.ts          # Global TypeScript types
│   ├── public/                      # Static assets
│   ├── Dockerfile                   # Frontend Docker config
│   ├── components.json              # Shadcn UI config
│   ├── next.config.ts               # Next.js configuration
│   ├── package.json                 # Frontend dependencies
│   ├── postcss.config.mjs           # PostCSS config
│   ├── tsconfig.json                # TypeScript configuration
│   └── README.md                    # Frontend documentation
│
├── docker-compose.yml               # Development Docker setup
├── docker-setup.ps1                 # Windows Docker setup script
├── setup-websocket-redis.ps1        # WebSocket/Redis setup
├── test-freepik-api.js              # API integration test
├── test-websocket-redis.js          # WebSocket test
└── README.md                        # Main project documentation
```

### Key Files Explained

**Backend:**
- `server.ts`: Initializes Express server, WebSocket, and connects to databases
- `app.ts`: Configures Express middleware, CORS, routes
- `imageGenerationOrchestrator.ts`: Manages the entire image generation workflow
- `jobQueue.ts`: Handles background job processing with Redis
- `websocketService.ts`: Real-time communication between server and clients

**Frontend:**
- `layout.tsx`: Wraps all pages with Clerk provider and theme
- `api-client.ts`: Centralized Axios configuration with interceptors
- `use-generation-socket.ts`: Custom hook for WebSocket connections
- `middleware.ts`: Next.js middleware for route protectionImage generated → uploaded to Cloudinary
7. Database updated with generation record
8. WebSocket notifies frontend of completion
9. Frontend displays result from CDN

### Database Schema

**Users Collection:**
```typescript
{
  _id: ObjectId,
  clerkId: string,           // Unique Clerk user ID
  email: string,
  firstName: string,
  lastName: string,
  imageUrl: string,
  subscriptionTier: enum,    // FREE, PRO, ENTERPRISE
  quotaUsed: number,
  quotaLimit: number,
  createdAt: Date,
  updatedAt: Date
}
```

**ImageGenerations Collection:**
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  prompt: string,
  negativePrompt: string,
  imageUrl: string,
  cloudinaryId: string,
  model: string,             // gemini, freepik
  settings: {
    aspectRatio: string,
    quality: string,
    style: string
  },
  status: enum,              // pending, processing, completed, failed
  processingTime: number,
  error: string,
  createdAt: Date
}
```

**Subscriptions Collection:**
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  tier: enum,
  status: enum,              // active, cancelled, expired
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: boolean,
  quotaLimit: number,
  quotaUsed: number,
  createdAt: Date,
  updatedAt: Date
}
```

### API Architecture

**RESTful API Structure:**
```
/api
  /auth
    POST /register          - Register new user
    POST /login            - Login user
    POST /logout           - Logout user
    GET  /me               - Get current user
  
  /generate
    POST /image            - Generate image
    POST /image/batch      - Generate multiple images
    GET  /image/:id        - Get generation details
    DELETE /image/:id      - Delete generation
  
  /video
    POST /generate         - Generate video
    GET  /:id              - Get video details
    GET  /:id/status       - Get generation status
  
  /health
    GET  /                 - Health check
    GET  /db               - Database health
    GET  /redis            - Redis health
```

**WebSocket Events:**
```typescript
// Client → Server
socket.emit('subscribe', { userId: string })
socket.emit('unsubscribe', { userId: string })

// Server → Client
socket.on('generation:started', { jobId, status })
socket.on('generation:progress', { jobId, progress })
socket.on('generation:completed', { jobId, result })
socket.on('generation:failed', { jobId, error })
```

---

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Frontend tests
cd frontend
npm test
```

### API Testing

**Using the test scripts:**
```bash
# Test Freepik API integration
node test-freepik-api.js

# Test WebSocket and Redis
node test-websocket-redis.js
```

**Manual API Testing (using curl):**

```bash
# Health check
curl http://localhost:5000/api/health

# Generate image (requires auth token)
curl -X POST http://localhost:5000/api/generate/image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "model": "gemini",
    "settings": {
      "aspectRatio": "16:9",
      "quality": "high"
    }
  }'
```

---

## 🚀 Deployment

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start

# Set environment
export NODE_ENV=production
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

### Docker Deployment

**Build production images:**
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### Environment-Specific Configurations

**Production Checklist:**
- [ ] Update `NODE_ENV=production`
- [ ] Use production MongoDB cluster (MongoDB Atlas recommended)
- [ ] Configure Redis with authentication
- [ ] Set up Cloudinary production environment
- [ ] Update CORS origins to production domain
- [ ] Enable rate limiting
- [ ] Configure Clerk production instance
- [ ] Set up monitoring and logging
- [ ] Enable HTTPS/SSL
- [ ] Configure CDN for static assets
- [ ] Set up automated backups
- [ ] Configure webhook endpoints

### Recommended Hosting Platforms

**Frontend:**
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Railway

**Backend:**
- Railway
- Render
- Heroku
- AWS EC2/ECS
- DigitalOcean App Platform

**Database:**
- MongoDB Atlas (managed)
- Railway (PostgreSQL alternative)

**Redis:**
- Redis Cloud
- Railway Redis
- AWS ElastiCache

---

## 📊 Performance Optimization

### Backend Optimizations
- Database indexing on frequently queried fields
- Redis caching for user sessions and quota data
- Job queue for async processing
- Image compression before upload
- CDN integration for media delivery
- Connection pooling for database
- Rate limiting to prevent abuse

### Frontend Optimizations
- Next.js Image component for automatic optimization
- Code splitting and lazy loading
- Server-side rendering (SSR) for SEO
- Static generation for landing pages
- Prefetching for faster navigation
- Optimistic UI updates
- WebSocket for real-time updates (no polling)

---

## 🔒 Security Features

- **Authentication**: Secure OAuth via Clerk
- **Authorization**: Role-based access control (RBAC)
- **Data Validation**: Zod schemas on both client and server
- **Rate Limiting**: Prevents API abuse
- **CORS**: Configured for specific origins
- **Environment Variables**: Sensitive data never committed
- **SQL Injection Prevention**: MongoDB with Mongoose ODM
- **XSS Protection**: React's built-in escaping
- **CSRF Protection**: Token-based validation
- **File Upload Security**: Type and size validation
- **Error Handling**: Never expose stack traces in productionr with yarn
yarn install
```

**Step 2: Install Frontend Dependencies**
```bash
cd frontend
npm install

# Or with yarn
yarn install
```

**Step 3: Start MongoDB and Redis**

Option A - Using Docker:
```bash
# MongoDB
docker run -d -p 27017:27017 --name artifex-mongo mongo:latest

# Redis
docker run -d -p 6379:6379 --name artifex-redis redis:latest
```

Option B - Local Installation:
- MongoDB: [Installation Guide](https://docs.mongodb.com/manual/installation/)
- Redis: [Installation Guide](https://redis.io/docs/getting-started/installation/)

**Step 4: Start Development Servers**

Terminal 1 - Backend:
```bash
cd backend
npm run dev

# Available scripts:
# npm run dev      - Start development server with hot reload
# npm run build    - Compile TypeScript to JavaScript
# npm start        - Run production build
# npm run lint     - Run ESLint
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev

# Available scripts:
# npm run dev      - Start Next.js development server
# npm run build    - Build for production
# npm start        - Run production build
# npm run lint     - Run ESLint
```

Terminal 3 - WebSocket/Redis Setup (if needed):
```powershell
# On Windows
.\setup-websocket-redis.ps1

# Or manually start Redis
redis-server
```

### 4. Database Setup

**Initialize Database Collections**

The application will automatically create collections on first run. To manually initialize:

```bash
# From backend directory
npm run db:seed

# Or use MongoDB Compass/CLI to verify connection
mongosh "mongodb://localhost:27017/artifex"
```

### 5. Verify Installation

**Health Checks:**
```bash
# Backend health
curl http://localhost:5000/api/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-12-21T...",
#   "services": {
#     "database": "connected",
#     "redis": "connected"
#   }
# }
```

**Frontend:**
- Navigate to `http://localhost:3000`
- You should see the landing page
- Try signing up/in with Clerk authentication

### 6. Troubleshooting

**Common Issues:**

1. **Port Already in Use**
```bash
# Find process using port
netstat -ano | findstr :5000
# Kill process
taskkill /PID <process_id> /F
```

2. **MongoDB Connection Failed**
- Verify MongoDB is running: `mongosh`
- Check connection string in `.env`
- Ensure no firewall blocking port 27017

3. **Redis Connection Failed**
- Verify Redis is running: `redis-cli ping` (should return PONG)
- Check Redis URL in backend `.env`

4. **Clerk Authentication Issues**
- Verify API keys are correct
- Check allowed origins in Clerk dashboard
- Ensure webhook URL is configured (for production)

5. **Image Upload Fails**
- Verify Cloudinary credentials
- Check file size limits (default 10MB)
- Ensure upload preset exists in Cloudinary dashboard

1. **MongoDB Atlas**: [Sign up](https://www.mongodb.com/cloud/atlas) and create a free cluster
2. **Clerk**: [Create account](https://clerk.com/) → New Application → Copy keys
3. **Cloudinary**: [Sign up](https://cloudinary.com/) → Dashboard → Copy credentials
4. **Google Gemini**: [Get API key](https://makersuite.google.com/app/apikey)
5. **Freepik API**: [Developer Portal](https://www.freepik.com/api) → Request access
6. **Redis**: Install locally or use [Redis Cloud](https://redis.com/try-free/)
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
