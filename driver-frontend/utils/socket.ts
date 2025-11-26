// utils/socket.ts - Driver Socket.IO Connection
import Constants from "expo-constants";
import { io, Socket } from "socket.io-client";

const backendUrl = Constants.expoConfig?.extra?.BACKEND_URL?.trim();
console.log("📡 Backend URL:", backendUrl);

let socket: Socket | null = null;

export const getDriverSocket = (): Socket => {
  if (!socket) {
    const url = backendUrl || "http://localhost:3000";

    console.log("🔌 Creating socket connection to:", url);

    socket = io(url, {
      transports: ["polling", "websocket"], // Try polling first for better mobile compatibility
      autoConnect: false, // We'll connect manually
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000, // Increased timeout for mobile networks
      forceNew: true,
    });

    socket.on("connect", () => {
      console.log("✅ Driver Socket connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Driver Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("🔴 Socket connection error:", error.message);
    });
  }
  return socket;
};

export const connectDriverSocket = () => {
  const socket = getDriverSocket();
  if (!socket.connected) {
    console.log("🔌 Connecting driver socket...");
    socket.connect();
  }
  return socket;
};

export const disconnectDriverSocket = () => {
  if (socket) {
    socket.disconnect();
    console.log("🔌 Driver socket disconnected");
  }
};
