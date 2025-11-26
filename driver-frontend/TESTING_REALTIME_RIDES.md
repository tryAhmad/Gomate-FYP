# Testing Instructions - Real-Time Rides

## 🎯 Current Setup

**Driver Location:** `[74.42812, 31.576079]` (Cavalry Ground, Lahore)  
**Search Radius:** 2km (2000 meters)

## ✅ Updated Test Rides (All Within 2km)

The `passenger-test.html` now creates 3 rides, all within range:

1. **Ride 1**: Pickup at Cavalry Ground (~100m from driver)
2. **Ride 2**: Pickup near Cavalry Ground (~300m from driver)
3. **Ride 3**: Pickup near driver location (~500m from driver)

## 🧪 How to Test

### 1. Make Sure Backend is Running

```powershell
cd gomate-backend
npm run start:dev
```

Wait for: `"Application is running on: http://localhost:3000"`

### 2. Make Sure Driver App is Connected

- App should show success alert: "✅ Connected Successfully"
- Backend logs: `Driver 68908c87f5bd1d56dcc631b8 registered for real-time`

### 3. Open Passenger Test Page

Open in Chrome:

```
file:///C:/Users/ahmad/Desktop/fyp%20try/Gomate-FYP/gomate-backend/src/socket/gateways/passenger-test.html
```

### 4. Create Test Rides

1. Click **"Connect to Backend"** → Should show green ✅
2. Click **"🚀 Create 3 Test Rides"**

### 5. Expected Results

**In Passenger Test Page:**

```
[Time] 📤 Sending 3 test rides (1 second apart)...
[Time] ✅ Test ride 1/3 sent (Fare: PKR 500)
[Time] ✅ Test ride 2/3 sent (Fare: PKR 350)
[Time] ✅ Test ride 3/3 sent (Fare: PKR 250)
```

**In Backend Console:**

```
Emitted ride request to driver socket: [socket-id]
Emitted ride request to driver socket: [socket-id]
Emitted ride request to driver socket: [socket-id]
```

**In Driver App:**

- Alert notification for each ride
- All 3 rides appear in "Solo Rides" tab
- Initially shows "Calculating..." for distance/time
- Then updates with actual distance and time (e.g., "7.5 KM", "16 min away")

**In Driver App Console (React Native):**

```
🚗 New ride request received: {...}
📍 Pickup coords: {latitude: 31.576079, longitude: 74.42618}
📍 Dropoff coords: {latitude: 31.517179, longitude: 74.38325}
✅ Ride added to list, now calculating distance...
📏 Ride distance: 7.5 KM
⏱️ Time to pickup: 2 min away
✅ Ride updated with distance and time
```

## 🐛 Troubleshooting

### Issue: Only 1 ride received

**Cause:** Rides are outside 2km radius  
**Fix:** ✅ Already fixed - all test rides now within 2km

### Issue: Distance shows "Calculating..." forever

**Possible Causes:**

1. **No driver location** - App needs location permissions
2. **Google Maps API error** - Check API key and quota
3. **Network error** - Check internet connection

**Check Console For:**

```
❌ Error calculating ride details: [error message]
```

**Solutions:**

- Grant location permissions to app
- Verify Google Maps API key in `.env`
- Check Maps API is enabled (Distance Matrix API, Geocoding API)

### Issue: No rides received at all

**Check:**

1. Backend running? `curl http://192.168.0.104:3000`
2. Driver connected? Check success alert
3. Same network? Both on 192.168.0.x subnet
4. Backend logs show: "Emitted ride request to driver socket"?

## 📊 Understanding the Flow

```
Passenger Test Page
  ↓ (emit 'createRideRequest')
Backend
  ↓ (check if pickup within 2km of driver)
  ↓ (YES → emit 'newRideRequest' to driver socket)
Driver App
  ↓ (receive event)
  ↓ (add ride with "Calculating...")
  ↓ (reverse geocode coordinates)
  ↓ (calculate distance & time)
  ↓ (update ride in list)
```

## 🎯 Success Criteria

- ✅ All 3 rides received (alerts shown)
- ✅ Rides appear in Solo Rides tab
- ✅ Distance and time calculated (not stuck on "Calculating...")
- ✅ Can click "View Ride" to see details

---

**Note:** If rides still show "Calculating...", reload the driver app and check the console for error messages. The new code shows detailed logs for each step.
