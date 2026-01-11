// utils/api.ts - Centralized API configuration
import Constants from "expo-constants";

// Get backend URL from environment or fallback to local
const backendUrl = Constants.expoConfig?.extra?.BACKEND_URL?.trim();

export const API_BASE_URL = backendUrl || "http://localhost:3000";
