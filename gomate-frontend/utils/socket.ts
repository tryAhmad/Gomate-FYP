// utils/socket.ts
import Constants from "expo-constants";
import { io } from "socket.io-client";

const userip = Constants.expoConfig?.extra?.USER_IP?.trim(); // trim to remove spaces/newlines
console.log("USER_IP:", userip); // check what you get

const socket = io(`http://${userip}:3000`, {
  transports: ["websocket"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000, // 20 seconds timeout for connection
});

export default socket;
