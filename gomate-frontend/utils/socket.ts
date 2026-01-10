// utils/socket.ts
import Constants from "expo-constants";
import { io, Socket } from "socket.io-client";

const backendUrl = Constants.expoConfig?.extra?.BACKEND_URL?.trim();
console.log("📡 Backend URL:", backendUrl);

let socket: Socket;

export const getSocket = (): Socket => {
  if (!socket) {
    const url = backendUrl || "http://localhost:3000";

    console.log("🔌 Creating socket connection to:", url);

    socket = io(url, {
      transports: ["polling", "websocket"], // Try polling first for better compatibility
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("❌ Socket disconnected"));
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket && socket.connected) {
    console.log("🔌 Disconnecting socket...");
    socket.disconnect();
  }
};
