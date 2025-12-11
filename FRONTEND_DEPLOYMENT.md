# 🚀 Frontend Deployment Guide

Complete guide for deploying ThinkBox frontend to production.

## 📋 Pre-Deployment Checklist

Before deploying, ensure:
- [ ] Backend is deployed and accessible at `https://thinkboxmajor.onrender.com`
- [ ] `.env.production` has correct `VITE_API_BASE_URL`
- [ ] All dependencies are installed (`npm install`)
- [ ] Production build works locally (`npm run build && npm run preview`)
- [ ] Git repository is up to date

## 🎯 Deployment Options

### Option 1: Vercel (Recommended) ⭐

**Why Vercel?**
- Optimized for Vite/React applications
- Automatic CI/CD with Git integration
- Fast global CDN
- Free SSL certificates
- Environment variable management

#### Step-by-Step Vercel Deployment

1. **Install Vercel CLI (Optional)**
   ```bash
   npm install -g vercel
   ```

2. **Deploy via Vercel Dashboard** (Easiest)
   
   a. Go to [vercel.com](https://vercel.com) and sign in with GitHub
   
   b. Click **"Add New Project"**
   
   c. Import your ThinkBox repository
   
   d. Configure project:
      - **Framework Preset:** Vite
      - **Root Directory:** `Client`
      - **Build Command:** `npm run build`
      - **Output Directory:** `dist`
   
   e. Add Environment Variables:
      - `VITE_API_BASE_URL` = `https://thinkboxmajor.onrender.com`
   
   f. Click **Deploy**

3. **Deploy via CLI** (Alternative)
   ```bash
   cd Client
   vercel
   # Follow the prompts:
   # - Link to existing project? No
   # - What's your project's name? thinkbox-frontend
   # - In which directory is your code located? ./
   # - Want to override the settings? Yes
   #   - Build Command: npm run build
   #   - Output Directory: dist
   #   - Development Command: npm run dev
   ```

4. **Set Environment Variables** (if using CLI)
   ```bash
   vercel env add VITE_API_BASE_URL production
   # Enter: https://thinkboxmajor.onrender.com
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

#### Vercel Configuration File

A `vercel.json` file has been created in the Client directory with optimized settings:
- SPA routing configuration
- Asset caching headers
- Automatic redirects to index.html

---

### Option 2: Netlify

**Why Netlify?**
- Excellent for static sites
- Easy drag-and-drop deployment
- Free SSL and CDN
- Form handling and serverless functions

#### Step-by-Step Netlify Deployment

1. **Deploy via Netlify Dashboard**
   
   a. Go to [netlify.com](https://netlify.com) and sign in
   
   b. Click **"Add new site"** → **"Import an existing project"**
   
   c. Connect to your Git provider (GitHub/GitLab/Bitbucket)
   
   d. Select ThinkBox repository
   
   e. Configure build settings:
      - **Base directory:** `Client`
      - **Build command:** `npm run build`
      - **Publish directory:** `Client/dist`
   
   f. Add Environment Variables:
      - Go to **Site settings** → **Environment variables**
      - Add: `VITE_API_BASE_URL` = `https://thinkboxmajor.onrender.com`
   
   g. Click **Deploy site**

2. **Deploy via Netlify CLI** (Alternative)
   ```bash
   npm install -g netlify-cli
   cd Client
   netlify deploy
   # Follow prompts:
   # - Create & configure new site
   # - Site name: thinkbox-frontend
   # - Publish directory: ./dist
   
   # Deploy to production
   netlify deploy --prod
   ```

#### Netlify Configuration File

A `netlify.toml` file has been created with:
- Build command and publish directory
- SPA redirect rules
- Asset caching headers
- Node.js version specification

---

### Option 3: Render

**Why Render?**
- Same platform as backend (easier management)
- Free static site hosting
- Automatic deploys from Git
- Pull request previews

#### Step-by-Step Render Deployment

1. Go to [render.com](https://render.com) and sign in

2. Click **"New +"** → **"Static Site"**

3. Connect repository and select ThinkBox

4. Configure:
   - **Name:** thinkbox-frontend
   - **Root Directory:** `Client`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `Client/dist`

5. Add Environment Variables:
   - `VITE_API_BASE_URL` = `https://thinkboxmajor.onrender.com`

6. Click **"Create Static Site"**

---

## 🧪 Testing Production Build Locally

Before deploying, test the production build:

```bash
cd Client

# Build for production
npm run build

# Preview production build locally
npm run preview

# Test the app at http://localhost:4173
```

**Test Checklist:**
- [ ] Login/Register works
- [ ] Notes can be created, edited, and deleted
- [ ] AI Chat responds correctly
- [ ] AI Insights generate properly
- [ ] Search functionality works
- [ ] File uploads work
- [ ] No console errors

---

## 🔄 Post-Deployment Steps

### 1. Update Backend CORS

After frontend is deployed, update the backend to allow the new frontend URL:

1. Get your frontend URL (e.g., `https://thinkbox.vercel.app`)

2. Update `Server/.env`:
   ```env
   CLIENT_URL=https://thinkbox.vercel.app
   ```

3. Restart backend server or redeploy on Render:
   - Go to Render dashboard
   - Select your backend service
   - Click **"Manual Deploy"** → **"Deploy latest commit"**

### 2. Verify CORS Configuration

The backend `server.js` is already configured to accept your frontend URL through `CLIENT_URL` environment variable.

### 3. End-to-End Testing

Test the deployed application:
- [ ] Open deployed frontend URL
- [ ] Register a new account
- [ ] Create a note
- [ ] Upload a file (PDF/image)
- [ ] Use AI Chat
- [ ] Generate AI Insights
- [ ] Test search functionality
- [ ] Check browser console for errors

---

## 🔧 Troubleshooting

### Issue: API calls fail with CORS error

**Solution:**
1. Verify `VITE_API_BASE_URL` is set correctly in deployment platform
2. Check backend logs for CORS errors
3. Ensure `CLIENT_URL` is set in backend and backend is restarted
4. Verify backend allows your frontend URL in CORS configuration

### Issue: Environment variables not working

**Solution:**
- Vercel: Variables must start with `VITE_`
- Netlify: Same requirement - `VITE_` prefix
- After adding variables, redeploy the site
- Check build logs for environment variable values

### Issue: 404 on page refresh

**Solution:**
- Ensure redirect rules are configured (already done in `vercel.json` and `netlify.toml`)
- Verify SPA fallback to `index.html` is enabled

### Issue: Build fails

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build

# Check for TypeScript/ESLint errors
npm run lint
```

---

## 📊 Deployment Comparison

| Feature | Vercel | Netlify | Render |
|---------|--------|---------|--------|
| **Speed** | ⚡⚡⚡ Fast | ⚡⚡⚡ Fast | ⚡⚡ Good |
| **Free Tier** | Generous | Generous | Limited |
| **CDN** | Global | Global | Global |
| **SSL** | ✅ Free | ✅ Free | ✅ Free |
| **Auto Deploy** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Preview Deploys** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Vite Optimized** | ✅ Yes | ⚠️ Good | ⚠️ Good |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Recommendation:** Use **Vercel** for best Vite/React performance.

---

## 🎉 Quick Deploy Commands

### For Vercel:
```bash
cd Client
vercel --prod
```

### For Netlify:
```bash
cd Client
netlify deploy --prod
```

### Update Backend After Deployment:
```bash
cd ../Server
# Add CLIENT_URL to .env
echo "CLIENT_URL=https://your-frontend-url.vercel.app" >> .env
# Redeploy backend manually on Render dashboard
```

---

## 📝 Notes

- **Environment Variables:** Must be prefixed with `VITE_` for Vite to expose them to the browser
- **Git Integration:** Push to main branch triggers automatic redeployment
- **Custom Domain:** Can be configured in deployment platform settings
- **Analytics:** Consider adding Vercel Analytics or Google Analytics post-deployment

---

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Render Documentation](https://render.com/docs/static-sites)
- [Vite Production Build Guide](https://vitejs.dev/guide/build.html)

---

**Last Updated:** 2024
**Project:** ThinkBox - AI-Powered Note-Taking Application
