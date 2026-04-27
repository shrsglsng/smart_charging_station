# 🚀 Smart Charging Station: Deployment Guide

This guide provides a step-by-step process for deploying the Smart Charging Station backend to a VPS and configuring it for production use.

## 📋 Prerequisites
- VPS with Ubuntu/Debian installed.
- Node.js (v18+) and npm installed.
- Access to Port 3000 on the VPS firewall.
- MongoDB Atlas account (Personal or Company).

---

## 🛠️ Step 1: VPS Initial Setup
Connect to your VPS via SSH:
```bash
ssh root@72.61.XXX.XXX
```

Update packages and install PM2 (to keep the app running):
```bash
sudo apt update
sudo npm install -g pm2
```
## 🛡️ Port Safety Check
If you have another live project on the VPS, check for port conflicts:
```bash
sudo lsof -i :3000   
```
If Port 3000 is occupied, change the `PORT` in your `.env` (Step 4) to `3001` or another available port.
---

## 📂 Step 2: Clone and Install
Clone the repository and install dependencies:
```bash
cd ~
git clone https://github.com/your_REPO_LINK_HERE
cd your_REPO_NAME

# Install Backend
cd backend && npm install

# Install and Build Admin Dashboard
cd ../admin_web
npm install
npm run build
```

---

## 🏗️ Step 3: Sync Admin Files to Backend
For the dashboard to work on the `/admin` URL, we must move the static build files into the backend's public folder:

```bash
# Create the directory
mkdir -p ~/your_REPO_NAME/backend/public/admin

# Copy the build files (Assuming 'dist' is the build output)
cp -r ~/your_REPO_NAME/admin_web/dist/* ~/your_REPO_NAME/backend/public/admin/
```

---

## 🔑 Step 4: Configure Environment Variables
Use `nano` to create the `.env` file. This file is NOT on GitHub for security reasons.

```bash
nano .env
```

**Paste the following content (Update with your actual MongoDB URI):**
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/charging_db
NODE_ENV=production
```
*   **To Save**: Press `Ctrl + O`, then `Enter`.
*   **To Exit**: Press `Ctrl + X`.

> [!IMPORTANT]
> **MongoDB Account Migration**: If you switch from a personal account to a company account, simply update the `MONGO_URI` here. The backend will automatically create all necessary documents and collections in the new account upon the first request.

---

## 🚀 Step 5: Start the Application
Navigate to the backend directory and use PM2 to start the server:

```bash
cd ~/your_REPO_NAME/backend
pm2 start src/server.js --name "charging-station-api"
pm2 save
pm2 startup
```

Check the status and logs:
```bash
pm2 status
pm2 logs charging-station-api
```

---

## 🖥️ Step 6: Accessing the Admin Dashboard
Since the backend serves the admin panel as static content, you do **not** need a domain name. You can access it directly via the VPS IP:

**URL**: `http://72.61.XXX.XXX:3000/admin`

---

## 📱 Step 7: Mobile App Configuration
On your local development machine, update the environment file so the tablet knows where to send requests:

1.  Open `mobile_app/.env.dev`.
2.  Update the `API_BASE_URL`:
    ```env
    API_BASE_URL=http://72.61.XXX.XXX:3000/api/v1
    ```
3.  Rebuild the app for the tablet.

---


