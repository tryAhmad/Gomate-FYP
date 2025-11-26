# 🚀 Driver Socket Connection - Quick Test Guide

## What Was Implemented

The driver app now connects to the backend server on app load, exactly like the driver.html test file.

### Connection Flow

1. **App loads** → Socket connection initiates
2. **Socket connects** → Driver auto-registers with backend
3. **Success alert** → "Driver connected successfully"
4. **Ready** → App can now receive real-time ride requests

## Test Checklist

### ✅ Step 1: Start Backend

```bash
cd gomate-backend
npm run start:dev
```

**Verify backend is running:**

- Look for: `✅ MongoDB connected`
- Look for: `Application is running on: http://localhost:3000`

### ✅ Step 2: Check Your IP Address

**Windows:**

```powershell
ipconfig
```

Find your **IPv4 Address** (e.g., `192.168.1.104`)

### ✅ Step 3: Update Driver App .env

Edit `driver-frontend/.env`:

```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.104:3000
```

Replace `192.168.1.104` with YOUR IP address from Step 2.

### ✅ Step 4: Restart Driver App

```bash
cd driver-frontend
# Stop expo (Ctrl+C if running)
npx expo start --clear
```

Press `a` for Android or `i` for iOS.

## Expected Behavior

### Success Case ✅

**Console Output:**

```
📡 Backend URL: http://192.168.1.104:3000
🔌 Creating socket connection to: http://192.168.1.104:3000
🔌 Initiating socket connection...
✅ Driver connected: abc123xyz
📡 Emitting driver data: { driverId: "68908...", location: [...], rideType: "car" }
```

**App Screen:**

- Shows "Connecting to server..." for 1-2 seconds
- Then shows **Alert: "✅ Connected Successfully - Driver registered and ready to receive ride requests!"**
- Click OK
- Shows normal driver home screen

### Failure Case ❌

**App Screen:**

- Shows "Connecting to server..."
- Then shows **"Connection Failed"** screen with error details
- Shows **"Retry Connection"** button

**Possible Errors:**

1. **Backend not running** → Start backend first
2. **Wrong IP address** → Update `.env` with correct IP
3. **Not on same network** → Connect phone/emulator to same WiFi as computer

## Driver Data Being Sent

The app sends this data (same as driver.html):

```javascript
{
  driverId: "68908c87f5bd1d56dcc631b8",  // Test driver ID
  location: [74.42812, 31.576079],       // [lng, lat]
  rideType: "car"
}
```

## Backend Verification

Check backend console for:

```
Driver 68908c87f5bd1d56dcc631b8 registered for real-time
```

## Test with Passenger App

1. ✅ Driver app connected and registered
2. Open passenger app (gomate-frontend)
3. Create a ride request near the driver location
4. **Driver app should receive** `newRideRequest` event

**Check driver console for:**

```
🚗 New ride request received: { ride: {...}, passenger: {...} }
```

## Troubleshooting

### "websocket error" in console

**Problem:** Can't connect to backend

**Solutions:**

1. Verify backend is running: `http://YOUR_IP:3000/api` in browser
2. Check `.env` has correct IP address
3. Disable firewall temporarily
4. Make sure phone and computer on same WiFi

### Alert not showing

**Problem:** Connection succeeds but no alert

**Check console for:**

- `✅ Driver connected: [socket-id]`
- `📡 Emitting driver data: {...}`

If both present, registration succeeded even without alert.

### "Retry Connection" button doesn't work

**Solution:**

1. Check backend is running
2. Verify IP in `.env`
3. Restart expo: `npx expo start --clear`

## Key Files Modified

```
driver-frontend/
├── utils/socket.ts          ← Socket connection manager
├── app/index.tsx            ← Added connection logic & UI
└── .env                     ← Backend URL config
```

## Next Steps

Once connected successfully:

- Driver will appear in backend's `connectedDrivers` map
- Passenger ride requests within 2km will be sent to this driver
- Implement UI to display incoming ride requests
- Add counter-offer functionality

## Production Notes

For production:

- Replace hardcoded `driverId` with actual driver from auth/database
- Get driver location from GPS instead of hardcoded coordinates
- Store `driverId` in AsyncStorage after login
