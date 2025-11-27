// Google Maps API type declarations
// This extends the Window interface to include the google namespace

declare global {
  interface Window {
    google: typeof google;
  }
}

export {};
