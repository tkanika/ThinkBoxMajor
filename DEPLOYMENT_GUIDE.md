# 🚀 ThinkBox Deployment Guide

## 📋 Current Deployment Status

### Backend (Deployed ✅)
- **URL**: https://thinkboxmajor.onrender.com
- **Platform**: Render
- **Status**: Live and Running

### Frontend (Pending)
- **Status**: Ready for deployment
- **Recommended Platforms**: Vercel, Netlify, or Render

---

## 🔧 Environment Configuration

### **Backend Configuration** (`Server/.env`)

Your backend is already configured with:
```env
PORT=8000
MONGODB_URI=mongodb+srv://kanika28:Kanika2808@cluster0.tcqsyas.mongodb.net/ThinkBox
JWT_SECRET=dev#secret
CLOUDINARY_CLOUD_NAME=drqmyndhf
CLOUDINARY_API_KEY=819468332239197
CLOUDINARY_API_SECRET=WGPMoec2Fe535C1XAUazCigc4Ko
GEMINI_API_KEY=AIzaSyBh5qkdoAPwDo_EFGyeb01J51nphRud7E8
RENDER_EXTERNAL_URL=https://thinkboxmajor.onrender.com
CLIENT_URL=  # Add your frontend URL after deployment
```

### **Frontend Configuration** (`Client/.env`)

#### For Local Development:
```env
VITE_API_BASE_URL=http://localhost:8000
```

#### For Production Deployment:
Use the `.env.production` file:
```env
VITE_API_BASE_URL=https://thinkboxmajor.onrender.com
```

---

## 🌐 How It Works

### **Automatic Environment Detection:**

The application automatically detects which environment it's running in:

```javascript
// Client/src/utils/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

- **Development**: Uses `http://localhost:8000`
- **Production**: Uses `https://thinkboxmajor.onrender.com`

### **CORS Configuration:**

The backend is configured to accept requests from:
- ✅ `http://localhost:5173` (Vite dev)
- ✅ `http://localhost:5174` (Vite alternate port)
- ✅ `http://localhost:3000` (React dev)
- ✅ `https://thinkboxmajor.onrender.com` (Backend URL)
- ✅ Any custom frontend URL you set in `CLIENT_URL`

---

## 📦 Frontend Deployment Options

### **Option 1: Vercel (Recommended)**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from Client folder:**
   ```bash
   cd Client
   vercel
   ```

3. **Configure Environment Variables in Vercel:**
   - Go to your Vercel project settings
   - Add: `VITE_API_BASE_URL=https://thinkboxmajor.onrender.com`

4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`

### **Option 2: Netlify**

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy from Client folder:**
   ```bash
   cd Client
   netlify deploy --prod
   ```

3. **Configure Environment Variables:**
   - Go to Site settings > Environment variables
   - Add: `VITE_API_BASE_URL=https://thinkboxmajor.onrender.com`

4. **Build Command:** `npm run build`
5. **Publish Directory:** `dist`

### **Option 3: Render (Same as Backend)**

1. **Connect your GitHub repository**
2. **Configure as a Static Site:**
   - **Build Command:** `cd Client && npm install && npm run build`
   - **Publish Directory:** `Client/dist`
   - **Environment Variable:** `VITE_API_BASE_URL=https://thinkboxmajor.onrender.com`

---

## 🔐 Post-Deployment Configuration

### **1. Update Backend CORS**

After deploying your frontend, update `Server/.env`:
```env
CLIENT_URL=https://your-frontend-url.vercel.app
```

Then redeploy your backend or restart it on Render.

### **2. Test Your Deployment**

1. **Backend Health Check:**
   ```bash
   curl https://thinkboxmajor.onrender.com/api/test
   ```
   Should return: `{"message":"CORS is working!","timestamp":"..."}`

2. **Frontend Connection:**
   - Open your deployed frontend URL
   - Try to register/login
   - Check browser console for any errors

---

## 🧪 Local Development Setup

### **For Contributors Running Locally:**

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd ThinkBox
   ```

2. **Setup Backend:**
   ```bash
   cd Server
   npm install
   cp .env.example .env  # Create .env file
   npm run dev
   ```

3. **Setup Frontend:**
   ```bash
   cd ../Client
   npm install
   cp .env.example .env  # Create .env file
   npm run dev
   ```

4. **Access locally:**
   - Backend: http://localhost:8000
   - Frontend: http://localhost:5173

---

## 🚨 Troubleshooting

### **CORS Errors:**

**Problem:** Frontend can't connect to backend
**Solution:** Check that your frontend URL is added to backend CORS configuration

```javascript
// Server/server.js
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-frontend-url.vercel.app',  // Add your URL
  // ...
];
```

### **Environment Variables Not Working:**

**Problem:** `VITE_API_BASE_URL` is undefined
**Solution:** 
- Vite requires variables to start with `VITE_`
- Restart dev server after changing `.env`
- Check console: `console.log(import.meta.env.VITE_API_BASE_URL)`

### **API Requests Failing:**

**Problem:** 404 or 500 errors
**Solution:**
1. Check backend is running: `https://thinkboxmajor.onrender.com/api/test`
2. Check browser network tab for actual error
3. Verify API base URL in console logs

---

## 📊 Deployment Checklist

### **Backend Deployment (✅ Complete)**
- [x] Deployed to Render
- [x] Environment variables configured
- [x] Database connected
- [x] CORS configured for localhost and production
- [x] Health check endpoint working

### **Frontend Deployment (Pending)**
- [ ] Choose deployment platform (Vercel/Netlify/Render)
- [ ] Configure environment variables
- [ ] Deploy frontend
- [ ] Test production build
- [ ] Update backend CORS with frontend URL
- [ ] Test end-to-end functionality

### **Final Steps**
- [ ] Update README with deployment URLs
- [ ] Add deployment badge to README
- [ ] Document deployment process
- [ ] Set up monitoring (optional)
- [ ] Configure custom domain (optional)

---

## 🎯 Quick Deploy Commands

### **Deploy Frontend to Vercel:**
```bash
cd Client
vercel --prod
```

### **Deploy Frontend to Netlify:**
```bash
cd Client
netlify deploy --prod
```

### **Test Production Build Locally:**
```bash
cd Client
npm run build
npm run preview
```

---

## 🔗 Useful Links

- **Backend URL**: https://thinkboxmajor.onrender.com
- **Backend Health**: https://thinkboxmajor.onrender.com/api/test
- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Cloudinary**: https://cloudinary.com/console

---

## 📝 Notes

1. **Free Tier Limitations:**
   - Render free tier may sleep after 15 minutes of inactivity
   - First request after sleep may take 30-60 seconds
   - Consider upgrading for production use

2. **Environment Security:**
   - Never commit `.env` files to Git
   - Keep API keys secure
   - Rotate credentials periodically

3. **Performance:**
   - Enable caching on frontend deployment
   - Use CDN for static assets
   - Monitor API response times

---

*Your backend is deployed and ready! Deploy your frontend to complete the setup.*
