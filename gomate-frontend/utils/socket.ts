// utils/socket.ts
import { io } from "socket.io-client";

const socket = io("http://192.168.1.43:3000", {
  transports: ["websocket"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000, // 20 seconds timeout for connection
});

export default socket;
