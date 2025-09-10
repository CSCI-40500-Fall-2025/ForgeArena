# 🚀 Deploying ForgeArena to Vercel

## Quick Deploy Steps

### Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI globally:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from your project root:**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Choose "yes" to link to existing project or create new
   - Accept the default settings

4. **For production deployment:**
   ```bash
   vercel --prod
   ```

### Option 2: GitHub Integration

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin proof-of-concept-prototype
   ```

2. **Go to [vercel.com](https://vercel.com)**
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Configure settings:**
   - Framework Preset: Other
   - Root Directory: Leave empty
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/build`
   - Install Command: `npm run install-deps`

6. **Click "Deploy"**

## Environment Variables

No environment variables needed for this prototype since it uses mock data.

## Post-Deployment

- Your app will be available at: `https://your-project-name.vercel.app`
- Backend API will be at: `https://your-project-name.vercel.app/api`
- Frontend will be served from the root

## Notes

- The backend runs as serverless functions on Vercel
- Mock data resets on each function cold start
- Perfect for demonstrations and prototypes
- No database setup required
