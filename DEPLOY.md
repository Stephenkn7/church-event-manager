# Deployment Guide

Church Event Manager is a web application with a real-time backend. To use it with other devices (like tablets or phones) in the same building, you need to "deploy" it on your local network.

## Option 1: Local Network (Recommended for Church)

You can run the application on one computer (the "Host") and access it from other devices via Wi-Fi.

### 1. Find your IP Address
On the computer running the app:
- **Mac**: Open System Settings -> Network -> Wi-Fi -> Details. Look for **IP Address** (e.g., `192.168.1.50`).
- **Windows**: Open Command Prompt, type `ipconfig`, and look for `IPv4 Address`.

### 2. Start the Application
Open your terminal and navigate to the project folder first:

```bash
cd "/Users/stephen/Desktop/DEKSTOP FILES/STEPHEN/APPLICATION /TEST CULTE APP"
npm run dev
```

Check the output for the "Network" URL:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.50:5173/   <-- This is the link!
```

### 3. Connect Other Devices
- Connect your Tablet/Phone to the **SAME Wi-Fi network** as the computer.
- Open the browser on the tablet (Safari/Chrome).
- Type the **Network URL** (e.g., `http://192.168.1.50:5173`).

### 4. Enable Tablet Mode
- On the tablet, tap the **"Mode PC"** button in the top right.
- Confirm to switch to **"Mode Tablette"**.
- The computer should now show **"Tablette Connectée"**.

---

## Option 2: Cloud Deployment (Advanced)

If you need to access the app from anywhere (outside the church Wi-Fi), you must host it on a server.
**Note**: Simple hosting like Vercel/Netlify will **NOT** work for the real-time features because this app uses a custom WebSocket server (`server.js`).

### Recommended Services
- **Railway** (https://railway.app)
- **Render** (https://render.com)

### Steps for Railway/Render:
1. Push your code to GitHub.
2. Link your GitHub repository to the service.
3. Set the **Build Command**: `npm install && npm run build`
4. Set the **Start Command**: `node server.js`
   - *Note: You may need to modify `server.js` to serve the `dist` folder files for production usage.*

## Production Setup (Optimized for Local Network)
To run in a more stable "production" mode locally:

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Serve it**:
   (You need to modify `server.js` to serve static files from `dist` folder, or use `vite preview`).
   
   For now, `npm run dev` is perfectly fine for local usage!
