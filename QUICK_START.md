# 🚀 ThinkBox Quick Start Guide

## 📍 URLs Reference

### Development
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:8000
- **Backend Health:** http://localhost:8000/api/test

### Production
- **Backend:** https://thinkboxmajor.onrender.com
- **Backend Health:** https://thinkboxmajor.onrender.com/api/test
- **Frontend:** *To be deployed*

---

## ⚡ Quick Commands

### Start Development Servers
```bash
# Terminal 1 - Backend
cd Server && npm run dev

# Terminal 2 - Frontend  
cd Client && npm run dev
```

### Deploy Frontend
```bash
# Vercel
cd Client && vercel

# Netlify
cd Client && netlify deploy --prod
```

### Test Production Build
```bash
cd Client
npm run build
npm run preview
```

---

## 🔧 Environment Variables

### Client/.env (Development)
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Client/.env.production (Production)
```env
VITE_API_BASE_URL=https://thinkboxmajor.onrender.com
```

### Server/.env (All Environments)
```env
PORT=8000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=dev#secret
CLOUDINARY_CLOUD_NAME=drqmyndhf
CLOUDINARY_API_KEY=819468332239197
CLOUDINARY_API_SECRET=WGPMoec2Fe535C1XAUazCigc4Ko
GEMINI_API_KEY=AIzaSyBh5qkdoAPwDo_EFGyeb01J51nphRud7E8
RENDER_EXTERNAL_URL=https://thinkboxmajor.onrender.com
CLIENT_URL=  # Add after frontend deployment
```

---

## 🧪 Quick Tests

### Test Backend
```bash
curl https://thinkboxmajor.onrender.com/api/test
# Expected: {"message":"CORS is working!","timestamp":"..."}
```

### Test Local Frontend
```bash
# Open browser console at http://localhost:5173
console.log(import.meta.env.VITE_API_BASE_URL)
# Expected: http://localhost:8000
```

### Test File Upload
1. Create a note with PDF type
2. Upload a test PDF file
3. Check progress indicator shows
4. Verify file appears in Cloudinary

---

## 📊 Project Structure

```
ThinkBox/
├── Client/                  # React Frontend
│   ├── .env                # Development config
│   ├── .env.production     # Production config
│   └── src/
│       ├── components/     # UI Components
│       ├── contexts/       # State Management
│       └── utils/
│           └── api.js      # API Configuration ⭐
│
├── Server/                  # Express Backend
│   ├── .env                # Environment variables
│   ├── server.js           # Entry point ⭐
│   ├── config/             # Configuration files
│   ├── routes/             # API Routes
│   ├── models/             # Database Models
│   └── services/           # AI Services
│
└── Documentation/
    ├── DEPLOYMENT_GUIDE.md
    ├── ENVIRONMENT_SETUP.md
    └── PROGRESS_REPORT.md
```

---

## 🔑 Key Features

- ✅ **Smart Environment Detection:** Automatically uses correct API URL
- ✅ **CORS Configured:** Works in development and production
- ✅ **File Upload:** 50MB limit with progress tracking
- ✅ **AI Integration:** Semantic search + ChatGPT-like chat
- ✅ **Secure:** Environment variables protected
- ✅ **Production Ready:** Deployed backend on Render

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| CORS Error | Add frontend URL to `CLIENT_URL` in Server/.env |
| API not connecting | Check `VITE_API_BASE_URL` and restart dev server |
| File upload timeout | Already fixed! 2-minute timeout for large files |
| Environment vars not loading | Restart Vite after changing .env |

---

## 📦 Dependencies

### Frontend
- React 19 + Vite
- Tailwind CSS
- React Router
- Axios

### Backend
- Express.js
- MongoDB + Mongoose
- JWT + bcrypt
- Cloudinary + Multer
- Google Gemini AI

---

## 🎯 Next Steps

1. ✅ **Backend deployed** → https://thinkboxmajor.onrender.com
2. ✅ **Environment configured** → Works locally and in production
3. 📝 **Deploy frontend** → Follow DEPLOYMENT_GUIDE.md
4. 🔄 **Update CORS** → Add frontend URL to backend
5. ✨ **Go live!**

---

**Happy Coding! 🚀**
