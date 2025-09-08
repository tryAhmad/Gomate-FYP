// utils/socket.ts
import { io } from "socket.io-client";

const socket = io("http://192.168.1.8:3000", {
  transports: ["websocket"],
  autoConnect: false,
});

export default socket;
