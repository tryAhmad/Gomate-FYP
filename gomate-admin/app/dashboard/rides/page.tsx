"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Eye,
  MapPin,
  DollarSign,
  Clock,
  Car,
  CheckCircle2,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { API_CONFIG } from "@/lib/api-config";
import { RideDetailsModal } from "@/components/rides/ride-details-modal";
import { RouteMapModal } from "@/components/rides/route-map-modal";
import { reverseGeocodeShortCached } from "@/lib/geocoding-cache";

interface Ride {
  _id: string;
  passengerID: {
    _id: string;
    username: string;
    email: string;
    phoneNumber: string;
  } | null;
  driverID: {
    _id: string;
    fullname: {
      firstname: string;
      lastname?: string;
    };
    email: string;
    phoneNumber: string;
    vehicle: {
      color: string;
      plate: string;
      capacity: number;
      vehicleType: string;
      company?: string;
      model?: string;
    };
    status: string;
  } | null;
  pickupLocation: {
    type: string;
    coordinates: [number, number];
  };
  dropoffLocation: {
    type: string;
    coordinates: [number, number];
  };
  rideType: string;
  rideMode: string;
  fare: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function RidesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [locationNames, setLocationNames] = useState<Map<string, string>>(
    new Map()
  );
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);

  useEffect(() => {
    fetchRides();
  }, []);

  useEffect(() => {
    if (rides.length > 0 && !geocodingInProgress) {
      geocodeLocations();
    }
  }, [rides]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/statistics/all-rides`
      );
      const data = await response.json();
      setRides(data.data || []);
    } catch (error) {
      console.error("Failed to fetch rides:", error);
    } finally {
      setLoading(false);
    }
  };

  const geocodeLocations = async () => {
    setGeocodingInProgress(true);
    const newLocationNames = new Map<string, string>();

    try {
      // Geocode locations in batches to avoid overwhelming the API
      const BATCH_SIZE = 5;
      for (let i = 0; i < rides.length; i += BATCH_SIZE) {
        const batch = rides.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.flatMap((ride) => [
            (async () => {
              const key = `${ride.pickupLocation.coordinates[1]},${ride.pickupLocation.coordinates[0]}`;
              const name = await reverseGeocodeShortCached(
                ride.pickupLocation.coordinates[1],
                ride.pickupLocation.coordinates[0]
              );
              if (name) newLocationNames.set(key, name);
            })(),
            (async () => {
              const key = `${ride.dropoffLocation.coordinates[1]},${ride.dropoffLocation.coordinates[0]}`;
              const name = await reverseGeocodeShortCached(
                ride.dropoffLocation.coordinates[1],
                ride.dropoffLocation.coordinates[0]
              );
              if (name) newLocationNames.set(key, name);
            })(),
          ])
        );

        // Update state after each batch for progressive rendering
        setLocationNames(new Map(newLocationNames));

        // Small delay between batches
        if (i + BATCH_SIZE < rides.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error("Error geocoding locations:", error);
    } finally {
      setGeocodingInProgress(false);
    }
  };

  const handleViewDetails = (rideId: string) => {
    setSelectedRideId(rideId);
    setDetailsModalOpen(true);
  };

  const handleViewRoute = (ride: Ride) => {
    setSelectedRide(ride);
    setRouteModalOpen(true);
  };

  const getPassengerName = (ride: Ride) => {
    return ride.passengerID?.username || "Unknown Passenger";
  };

  const getDriverName = (ride: Ride) => {
    if (!ride.driverID) return "No Driver Assigned";
    const { firstname, lastname } = ride.driverID.fullname;
    return `${firstname} ${lastname || ""}`.trim();
  };

  const formatLocation = (coordinates: [number, number]) => {
    return `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`;
  };

  const getLocationName = (coordinates: [number, number]): string => {
    const key = `${coordinates[1]},${coordinates[0]}`;
    return locationNames.get(key) || formatLocation(coordinates);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    };
  };

  const filteredRides = rides.filter((ride) => {
    const searchLower = searchTerm.toLowerCase();
    const passengerName = getPassengerName(ride).toLowerCase();
    const driverName = getDriverName(ride).toLowerCase();
    const rideId = ride._id.toLowerCase();

    return (
      passengerName.includes(searchLower) ||
      driverName.includes(searchLower) ||
      rideId.includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "started":
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "matched":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const stats = {
    total: rides.length,
    completed: rides.filter((r) => r.status === "completed").length,
    inProgress: rides.filter(
      (r) => r.status === "started" || r.status === "accepted"
    ).length,
    totalRevenue: rides
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + r.fare, 0)
      .toFixed(2),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Rides Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage all platform rides
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
            <Car className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time rides</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Loader2 className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.inProgress}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">
              From completed rides
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Rides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ride number, passenger, or driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ride ID</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Fare</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">Loading rides...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredRides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">No rides found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRides.map((ride) => {
                    const { date, time } = formatDateTime(ride.createdAt);
                    return (
                      <TableRow key={ride._id}>
                        <TableCell className="font-mono text-xs font-semibold">
                          {ride._id.slice(-8).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getPassengerName(ride)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getDriverName(ride)}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-green-600" />
                              <span
                                className="truncate max-w-[200px]"
                                title={formatLocation(
                                  ride.pickupLocation.coordinates
                                )}
                              >
                                {getLocationName(
                                  ride.pickupLocation.coordinates
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-red-600" />
                              <span
                                className="truncate max-w-[200px]"
                                title={formatLocation(
                                  ride.dropoffLocation.coordinates
                                )}
                              >
                                {getLocationName(
                                  ride.dropoffLocation.coordinates
                                )}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          PKR {ride.fare}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{date}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {time}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                              ride.status
                            )}`}
                          >
                            {getStatusLabel(ride.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(ride._id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleViewRoute(ride)}
                              >
                                <MapPin className="h-4 w-4 mr-2" />
                                View Route
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <DollarSign className="h-4 w-4 mr-2" />
                                View Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedRideId && (
        <RideDetailsModal
          rideId={selectedRideId}
          open={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedRideId(null);
          }}
        />
      )}

      {selectedRide && (
        <RouteMapModal
          open={routeModalOpen}
          onClose={() => {
            setRouteModalOpen(false);
            setSelectedRide(null);
          }}
          pickupCoordinates={selectedRide.pickupLocation.coordinates}
          dropoffCoordinates={selectedRide.dropoffLocation.coordinates}
          pickupLabel={getLocationName(selectedRide.pickupLocation.coordinates)}
          dropoffLabel={getLocationName(
            selectedRide.dropoffLocation.coordinates
          )}
        />
      )}
    </div>
  );
}
