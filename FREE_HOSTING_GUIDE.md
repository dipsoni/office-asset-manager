# 🌐 Free Hosting Guide for AssetVault (Asset Management System)

You have **two 100% FREE ways** to run and host this system so that both you and your colleague can use it simultaneously from different PCs.

---

## ⚡ Option 1: Instant Free Online Tunnel (Easiest - 10 Seconds, No Signup)

Use this if you want an instant online link **right now** without creating any cloud accounts or GitHub repositories.

### How to use:
1. Double-click the file:
   ```
   start-free-online-tunnel.bat
   ```
   *(Located inside `C:\Users\deepd\.gemini\antigravity-ide\scratch\personal-asset-manager\`)*

2. It will boot the system and show a line like:
   ```
   your url is: https://funny-wolves-cheer.loca.lt
   ```

3. **Share that HTTPS link with your colleague on the other PC.**
   - On first open, localtunnel asks for your "Tunnel Password" (this is simply your public IP, which is displayed on the screen or can be found by visiting `https://loca.lt/mytunnelpassword`).
   - Once submitted, your colleague has full access to the complete AssetVault system!
   - Any asset added, assignment made, handover created, or employee resigned is **immediately saved** to your real database in real time.

---

## ☁️ Option 2: 24/7 Free Cloud Server on Render.com (Permanent Link, PC Can Be Off)

Use this if you want the system to live on a permanent cloud URL (e.g., `https://my-company-assets.onrender.com`) that runs **24/7 in the cloud even when your local PC is turned off**.

We have already configured:
- Root [`package.json`](file:///C:/Users/deepd/.gemini/antigravity-ide/scratch/personal-asset-manager/package.json) with auto-build scripts.
- [`render.yaml`](file:///C:/Users/deepd/.gemini/antigravity-ide/scratch/personal-asset-manager/render.yaml) for automatic 1-click Render setup.
- Unified Express server in [`backend/server.js`](file:///C:/Users/deepd/.gemini/antigravity-ide/scratch/personal-asset-manager/backend/server.js) that serves both the frontend web app and backend API on a single port.
- Preserved database [`backend/data/assets.db`](file:///C:/Users/deepd/.gemini/antigravity-ide/scratch/personal-asset-manager/backend/data/assets.db) containing all your 137 assets, 134 assignments, and 44 employees.

### Steps to Deploy to Render:

1. **Upload your project to GitHub**:
   - Go to [github.com](https://github.com) and create a free account if you don't already have one.
   - Click **New repository** (you can name it `office-asset-manager` and set it to **Private**).
   - Upload the project files from `personal-asset-manager` (drag & drop or via GitHub Desktop).
   - *Note: Do not include `node_modules` (already configured in `.gitignore`).*

2. **Deploy on Render (100% Free)**:
   - Go to [render.com](https://render.com) and sign up with your GitHub account (Free, no credit card required).
   - In your dashboard, click **New +** and choose **Web Service**.
   - Select your GitHub repository (`office-asset-manager`).
   - Render will automatically detect the settings:
     - **Runtime**: `Node`
     - **Build Command**: `npm run build`
     - **Start Command**: `node backend/server.js`
     - **Instance Type**: `Free`
   - Click **Deploy Web Service**.

3. **Open Your App**:
   - In 2–3 minutes, Render will provide your public URL:
     `https://<your-service-name>.onrender.com`
   - Bookmark this URL on both computers! Anyone with the link can now manage assets at the same time.

---

## 🏢 Option 3: Local Office Network (No Internet Needed)

If both computers are connected to the same office Wi-Fi or router:
- Double-click `start-asset-manager.bat`
- You open: `http://localhost:5000`
- The other person opens: `http://192.168.1.18:5000`
- Works instantly without using any internet bandwidth!
