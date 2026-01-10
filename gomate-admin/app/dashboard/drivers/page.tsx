"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  MoreHorizontal,
  Trash2,
  Edit2,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { API_CONFIG } from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";

interface Driver {
  _id: string;
  fullname: {
    firstname: string;
    lastname?: string;
  };
  email: string;
  phoneNumber: string;
  status: "active" | "inactive";
  vehicle: {
    color: string;
    plate: string;
    capacity: number;
    vehicleType: "car" | "motorcycle" | "auto";
    company?: string;
    model?: string;
  };
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [rideCounts, setRideCounts] = useState<Record<string, number>>({});
  const [driverRatings, setDriverRatings] = useState<
    Record<string, { averageRating: number; totalRatings: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Modal States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phoneNumber: "",
    vehicleColor: "",
    vehiclePlate: "",
    vehicleCapacity: 0,
    vehicleType: "car" as "car" | "motorcycle" | "auto",
    vehicleCompany: "",
    vehicleModel: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete Modal States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { toast } = useToast();

  const fetchDriversAndRides = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch drivers and ride counts in parallel
      const [driversResponse, rideCountsResponse] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/drivers`),
        fetch(`${API_CONFIG.BASE_URL}/statistics/driver-ride-counts`),
      ]);

      if (!driversResponse.ok) {
        const errorText = await driversResponse.text();
        console.error("Drivers API error:", errorText);
        throw new Error(
          `Failed to fetch drivers (${driversResponse.status}). Is the backend running at ${API_CONFIG.BASE_URL}?`
        );
      }

      if (!rideCountsResponse.ok) {
        const errorText = await rideCountsResponse.text();
        console.error("Ride counts API error:", errorText);
        throw new Error(
          `Failed to fetch ride counts (${rideCountsResponse.status})`
        );
      }

      const driversData = await driversResponse.json();
      const rideCountsData = await rideCountsResponse.json();

      setDrivers(driversData.drivers || []);
      setRideCounts(rideCountsData.data || {});

      // Fetch ratings for all drivers
      const drivers = driversData.drivers || [];
      const ratingsPromises = drivers.map((driver: Driver) =>
        fetch(
          `${API_CONFIG.BASE_URL}/ride-request/driver/${driver._id}/average-rating`
        )
          .then((res) => res.json())
          .catch(() => ({ averageRating: 0, totalRatings: 0 }))
      );

      const ratingsResults = await Promise.all(ratingsPromises);
      const ratingsMap: Record<
        string,
        { averageRating: number; totalRatings: number }
      > = {};

      drivers.forEach((driver: Driver, index: number) => {
        ratingsMap[driver._id] = ratingsResults[index];
      });

      setDriverRatings(ratingsMap);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please ensure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriversAndRides();
  }, []);

  const getDriverName = (driver: Driver) => {
    return `${driver.fullname.firstname} ${
      driver.fullname.lastname || ""
    }`.trim();
  };

  const getVehicleDescription = (vehicle: Driver["vehicle"]) => {
    return `${vehicle.color || ""} ${vehicle.company || ""} ${
      vehicle.model || ""
    }`.trim();
  };

  const filteredDrivers = drivers.filter(
    (driver) =>
      getDriverName(driver).toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // View Driver Handler
  const handleView = async (driverId: string) => {
    setViewLoading(true);
    setViewModalOpen(true);

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/drivers/${driverId}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.message ||
          `Failed to fetch driver details (${response.status})`;
        console.error("View driver error:", errorData || errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSelectedDriver(data.driver);
    } catch (err) {
      console.error("Error fetching driver details:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load driver details";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // Edit Driver Handler
  const handleEdit = async (driverId: string) => {
    setEditLoading(true);

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/drivers/${driverId}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.message ||
          `Failed to fetch driver details (${response.status})`;
        console.error("Edit driver error:", errorData || errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const driver = data.driver;

      setSelectedDriver(driver);
      setEditFormData({
        firstname: driver.fullname.firstname,
        lastname: driver.fullname.lastname || "",
        email: driver.email,
        phoneNumber: driver.phoneNumber,
        vehicleColor: driver.vehicle.color,
        vehiclePlate: driver.vehicle.plate,
        vehicleCapacity: driver.vehicle.capacity,
        vehicleType: driver.vehicle.vehicleType,
        vehicleCompany: driver.vehicle.company || "",
        vehicleModel: driver.vehicle.model || "",
      });
      setEditModalOpen(true);
    } catch (err) {
      console.error("Error fetching driver details:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load driver details";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Save Edit Handler
  const handleSaveEdit = async () => {
    if (!selectedDriver) return;

    setEditLoading(true);

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/drivers/${selectedDriver._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullname: {
              firstname: editFormData.firstname,
              lastname: editFormData.lastname,
            },
            email: editFormData.email,
            phoneNumber: editFormData.phoneNumber,
            vehicle: {
              color: editFormData.vehicleColor,
              plate: editFormData.vehiclePlate,
              capacity: editFormData.vehicleCapacity,
              vehicleType: editFormData.vehicleType,
              company: editFormData.vehicleCompany,
              model: editFormData.vehicleModel,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Update failed:", errorData);
        throw new Error(errorData.message || "Failed to update driver");
      }

      toast({
        title: "Success",
        description: "Driver updated successfully",
      });

      setEditModalOpen(false);
      await fetchDriversAndRides();
    } catch (err) {
      console.error("Error updating driver:", err);
      toast({
        title: "Error",
        description: "Failed to update driver",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Driver Handler
  const handleDeleteClick = (driver: Driver) => {
    setDriverToDelete(driver);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!driverToDelete) return;

    setDeleteLoading(true);

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/drivers/${driverToDelete._id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete driver");
      }

      toast({
        title: "Success",
        description: "Driver deleted successfully",
      });

      setDeleteDialogOpen(false);
      setDriverToDelete(null);
      await fetchDriversAndRides();
    } catch (err) {
      console.error("Error deleting driver:", err);
      toast({
        title: "Error",
        description: "Failed to delete driver",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusToggle = async (
    id: string,
    currentStatus: "active" | "inactive"
  ) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const response = await fetch(`${API_CONFIG.BASE_URL}/drivers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.message ||
          `Failed to update driver status (${response.status})`;
        console.error("Status update error:", errorData || errorMessage);
        throw new Error(errorMessage);
      }

      // Update local state
      setDrivers(
        drivers.map((driver) =>
          driver._id === id ? { ...driver, status: newStatus } : driver
        )
      );
    } catch (err) {
      console.error("Error updating driver status:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update driver status";
      alert(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: "active" | "inactive") => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading drivers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-red-500">
            Failed to Load Drivers
          </h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <p className="text-sm text-muted-foreground">
            API URL: {API_CONFIG.BASE_URL}
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Drivers Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor all platform drivers
          </p>
        </div>
        <Button>Add New Driver</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers.length}</div>
            <p className="text-xs text-muted-foreground">Registered drivers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers.filter((d) => d.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers.filter((d) => d.status === "inactive").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Not currently available
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Plate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Completed Rides</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getDriverName(driver)}</p>
                        <p className="text-sm text-muted-foreground">
                          {driver.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {driver.phoneNumber}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getVehicleDescription(driver.vehicle)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {driver.vehicle.plate}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                          driver.status
                        )}`}
                      >
                        {capitalizeStatus(driver.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        {driverRatings[driver._id]?.averageRating > 0 ? (
                          <>
                            <span className="text-yellow-500">★</span>
                            <span className="font-semibold">
                              {driverRatings[driver._id].averageRating.toFixed(
                                1
                              )}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              ({driverRatings[driver._id].totalRatings})
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            No ratings
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">
                          {rideCounts[driver._id] || 0}
                        </span>
                        <span className="text-muted-foreground">rides</span>
                      </div>
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
                            onClick={() => handleView(driver._id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(driver._id)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusToggle(driver._id, driver.status)
                            }
                          >
                            {driver.status === "active" ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Set Inactive
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Set Active
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteClick(driver)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredDrivers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No drivers found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Driver Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Driver Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected driver
            </DialogDescription>
          </DialogHeader>

          {viewLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedDriver ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">ID:</Label>
                <div className="col-span-3 text-sm">{selectedDriver._id}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Name:</Label>
                <div className="col-span-3 text-sm">
                  {getDriverName(selectedDriver)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Email:</Label>
                <div className="col-span-3 text-sm">{selectedDriver.email}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Phone:</Label>
                <div className="col-span-3 text-sm">
                  {selectedDriver.phoneNumber}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Status:</Label>
                <div className="col-span-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                      selectedDriver.status
                    )}`}
                  >
                    {capitalizeStatus(selectedDriver.status)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">
                  Vehicle Type:
                </Label>
                <div className="col-span-3 text-sm">
                  {capitalizeStatus(selectedDriver.vehicle.vehicleType)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Vehicle:</Label>
                <div className="col-span-3 text-sm">
                  {getVehicleDescription(selectedDriver.vehicle)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Plate:</Label>
                <div className="col-span-3 text-sm font-mono">
                  {selectedDriver.vehicle.plate}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Capacity:</Label>
                <div className="col-span-3 text-sm">
                  {selectedDriver.vehicle.capacity} passengers
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">
                  Completed Rides:
                </Label>
                <div className="col-span-3 text-sm">
                  {rideCounts[selectedDriver._id] || 0} rides
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Location:</Label>
                <div className="col-span-3 text-sm">
                  {selectedDriver.location.coordinates[1].toFixed(4)},{" "}
                  {selectedDriver.location.coordinates[0].toFixed(4)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Created:</Label>
                <div className="col-span-3 text-sm">
                  {formatDate(selectedDriver.createdAt)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Updated:</Label>
                <div className="col-span-3 text-sm">
                  {formatDate(selectedDriver.updatedAt)}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>
              Update driver information. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="font-semibold">Personal Information</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstname">First Name</Label>
                <Input
                  id="firstname"
                  value={editFormData.firstname}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      firstname: e.target.value,
                    })
                  }
                  placeholder="Enter first name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  value={editFormData.lastname}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      lastname: e.target.value,
                    })
                  }
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
                placeholder="Enter email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={editFormData.phoneNumber}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    phoneNumber: e.target.value,
                  })
                }
                placeholder="03XXXXXXXXX"
                maxLength={11}
              />
            </div>

            <div className="grid gap-2 mt-4">
              <Label className="font-semibold">Vehicle Information</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <select
                  id="vehicleType"
                  value={editFormData.vehicleType}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      vehicleType: e.target.value as
                        | "car"
                        | "motorcycle"
                        | "auto",
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicleCapacity">Capacity</Label>
                <Input
                  id="vehicleCapacity"
                  type="number"
                  min="1"
                  max="20"
                  value={editFormData.vehicleCapacity}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      vehicleCapacity: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Passenger capacity"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vehicleColor">Color</Label>
                <Input
                  id="vehicleColor"
                  value={editFormData.vehicleColor}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      vehicleColor: e.target.value,
                    })
                  }
                  placeholder="Vehicle color"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehiclePlate">Plate Number</Label>
                <Input
                  id="vehiclePlate"
                  value={editFormData.vehiclePlate}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      vehiclePlate: e.target.value,
                    })
                  }
                  placeholder="License plate"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vehicleCompany">Company/Make</Label>
                <Input
                  id="vehicleCompany"
                  value={editFormData.vehicleCompany}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      vehicleCompany: e.target.value,
                    })
                  }
                  placeholder="e.g., Toyota, Honda"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicleModel">Model</Label>
                <Input
                  id="vehicleModel"
                  value={editFormData.vehicleModel}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      vehicleModel: e.target.value,
                    })
                  }
                  placeholder="e.g., Corolla, Civic"
                />
              </div>
            </div>

            {selectedDriver && (
              <div className="grid gap-2 mt-4">
                <Label className="text-muted-foreground">Additional Info</Label>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>Driver ID: {selectedDriver._id}</p>
                  <p>
                    Current Status: {capitalizeStatus(selectedDriver.status)}
                  </p>
                  <p>Created: {formatDate(selectedDriver.createdAt)}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={editLoading}>
              {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              driver account
              {driverToDelete && (
                <span className="font-semibold">
                  {" "}
                  &quot;{getDriverName(driverToDelete)}&quot;
                </span>
              )}{" "}
              and remove all associated data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Driver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
