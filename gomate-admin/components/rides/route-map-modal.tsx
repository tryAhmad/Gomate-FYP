"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MapPin, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RouteMapModalProps {
  open: boolean;
  onClose: () => void;
  pickupCoordinates: [number, number]; // [lng, lat]
  dropoffCoordinates: [number, number]; // [lng, lat]
  pickupLabel?: string;
  dropoffLabel?: string;
}

export function RouteMapModal({
  open,
  onClose,
  pickupCoordinates,
  dropoffCoordinates,
  pickupLabel = "Pickup Location",
  dropoffLabel = "Dropoff Location",
}: RouteMapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadGoogleMapsScript();
    }

    return () => {
      // Cleanup on unmount
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [open]);

  useEffect(() => {
    if (open && mapLoaded && mapRef.current) {
      initializeMap();
    }
  }, [open, mapLoaded, pickupCoordinates, dropoffCoordinates]);

  const loadGoogleMapsScript = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError("Google Maps API key is not configured");
      setLoading(false);
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkLoaded);
          setMapLoaded(true);
        }
      }, 100);
      return;
    }

    // Load the script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => {
      setError("Failed to load Google Maps");
      setLoading(false);
    };
    document.head.appendChild(script);
  };

  const initializeMap = async () => {
    if (!mapRef.current || !window.google) return;

    try {
      setLoading(true);
      setError(null);

      // Convert coordinates: [lng, lat] -> {lat, lng}
      const pickup = {
        lat: pickupCoordinates[1],
        lng: pickupCoordinates[0],
      };
      const dropoff = {
        lat: dropoffCoordinates[1],
        lng: dropoffCoordinates[0],
      };

      // Calculate center point between pickup and dropoff
      const centerLat = (pickup.lat + dropoff.lat) / 2;
      const centerLng = (pickup.lng + dropoff.lng) / 2;

      // Initialize map
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;

      // Initialize directions service and renderer
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: "#2563eb",
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
      });

      directionsRendererRef.current = directionsRenderer;

      // Request directions
      const request: google.maps.DirectionsRequest = {
        origin: pickup,
        destination: dropoff,
        travelMode: google.maps.TravelMode.DRIVING,
      };

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);

          // Extract distance and duration
          const route = result.routes[0];
          if (route && route.legs && route.legs.length > 0) {
            const leg = route.legs[0];
            setDistance(leg.distance?.text || null);
            setDuration(leg.duration?.text || null);
          }

          setLoading(false);
        } else {
          setError(`Failed to calculate route: ${status}`);
          setLoading(false);

          // Fallback: show markers if directions fail
          new google.maps.Marker({
            position: pickup,
            map: map,
            title: pickupLabel,
            icon: {
              url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
            },
          });

          new google.maps.Marker({
            position: dropoff,
            map: map,
            title: dropoffLabel,
            icon: {
              url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            },
          });

          // Fit bounds to show both markers
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(pickup);
          bounds.extend(dropoff);
          map.fitBounds(bounds);
        }
      });
    } catch (err) {
      console.error("Error initializing map:", err);
      setError("Failed to initialize map");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Route Map</DialogTitle>
          <DialogDescription>
            View the route between pickup and dropoff locations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Route Info */}
          {(distance || duration) && !loading && (
            <div className="flex items-center gap-6 p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Distance: </span>
                  <span className="font-semibold">{distance}</span>
                </div>
              </div>
              {duration && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Duration: </span>
                    <span className="font-semibold">{duration}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Map Container */}
          <div className="relative w-full h-[500px] rounded-lg overflow-hidden border">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary/80 z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Loading map...
                  </p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />
          </div>

          {/* Location Labels */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Pickup Location</p>
                <p className="text-xs text-muted-foreground">
                  {pickupLabel !== "Pickup Location"
                    ? pickupLabel
                    : `${pickupCoordinates[1].toFixed(
                        4
                      )}, ${pickupCoordinates[0].toFixed(4)}`}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium">Dropoff Location</p>
                <p className="text-xs text-muted-foreground">
                  {dropoffLabel !== "Dropoff Location"
                    ? dropoffLabel
                    : `${dropoffCoordinates[1].toFixed(
                        4
                      )}, ${dropoffCoordinates[0].toFixed(4)}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
