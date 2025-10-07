// utils/socket.ts
import Constants from "expo-constants";
import { io, Socket } from "socket.io-client";

const userip = Constants.expoConfig?.extra?.USER_IP?.trim();
console.log("USER_IP:", userip);

let socket: Socket;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(`http://${userip}:3000`, {
      transports: ["websocket"],
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
