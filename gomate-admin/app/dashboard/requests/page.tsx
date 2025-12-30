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
  CheckCircle,
  XCircle,
  Eye,
  Clock,
} from "lucide-react";
import { DriverRequestModal } from "@/components/driver-requests/driver-request-modal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface Driver {
  _id: string;
  fullname: { firstname: string; lastname?: string };
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
  profilePhoto?: { url: string; publicId: string };
  vehicle: {
    company?: string;
    model?: string;
    color: string;
    plate: string;
    capacity: number;
    vehicleType: string;
    images?: Array<{ url: string; publicId: string }>;
  };
  documents?: {
    cnic?: {
      front?: { url: string };
      back?: { url: string };
    };
    selfieWithId?: { url: string };
    drivingLicense?: {
      front?: { url: string };
      back?: { url: string };
    };
  };
  verificationStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

const mockRequests = [
  {
    id: 1,
    name: "Muhammad Usman",
    email: "muhammad.usman@gmail.com",
    phone: "03123456789",
    dob: "1990-05-15",
    licenseNumber: "AVA9012",
    vehicle: "Honda Civic 2023",
    submittedDate: "2025-08-15",
    status: "Pending",
    documents: ["License", "Registration"],
    profilePhoto: "/profile-photo.jpg",
    cnic: { front: "/cnic-front.jpg", back: "/cnic-back.jpg" },
    selfieWithId: "/selfie-with-id.jpg",
    license: { front: "/license-front.jpg", back: "/license-back.jpg" },
    vehicleDetails: {
      type: "Car",
      model: "Honda Civic",
      color: "Black",
      registration: "ABC-123-XYZ",
      photos: ["/vehicle-1.jpg", "/vehicle-2.jpg", "/vehicle-3.jpg"],
    },
  },
  {
    id: 2,
    name: "Alina Ashfaq",
    email: "alina.ashfaq@gmail.com",
    phone: "03123456790",
    dob: "1992-08-22",
    licenseNumber: "ANP9013",
    vehicle: "Suzuki WagonR 2022",
    submittedDate: "2024-03-14",
    status: "Under Review",
    documents: ["License", "Registration", "Background Check"],
    profilePhoto: "/profile-photo-2.jpg",
    cnic: { front: "/cnic-front-2.jpg", back: "/cnic-back-2.jpg" },
    selfieWithId: "/selfie-with-id-2.jpg",
    license: { front: "/license-front-2.jpg", back: "/license-back-2.jpg" },
    vehicleDetails: {
      type: "Car",
      model: "Suzuki WagonR",
      color: "Silver",
      registration: "DEF-456-UVW",
      photos: ["/vehicle-1.jpg", "/vehicle-2.jpg", "/vehicle-3.jpg"],
    },
  },
  {
    id: 3,
    name: "Junaid Ali",
    email: "junaid.ali@example.com",
    phone: "03123456792",
    dob: "1988-03-10",
    licenseNumber: "DLM8914",
    vehicle: "Suzuki Alto 2023",
    submittedDate: "2024-03-13",
    status: "Pending",
    documents: ["License", "Insurance"],
    profilePhoto: "/profile-photo.jpg",
    cnic: { front: "/cnic-front.jpg", back: "/cnic-back.jpg" },
    selfieWithId: "/selfie-with-id.jpg",
    license: { front: "/license-front.jpg", back: "/license-back.jpg" },
    vehicleDetails: {
      type: "Car",
      model: "Suzuki Alto",
      color: "White",
      registration: "GHI-789-RST",
      photos: ["/vehicle-1.jpg", "/vehicle-2.jpg", "/vehicle-3.jpg"],
    },
  },
  {
    id: 4,
    name: "Saba Khan",
    email: "saba.khan@example.com",
    phone: "03123456793",
    dob: "1995-11-30",
    licenseNumber: "AYP7715",
    vehicle: "Honda City 2022",
    submittedDate: "2024-03-12",
    status: "Approved",
    documents: ["License", "Registration", "Background Check"],
    profilePhoto: "/profile-photo-2.jpg",
    cnic: { front: "/cnic-front-2.jpg", back: "/cnic-back-2.jpg" },
    selfieWithId: "/selfie-with-id-2.jpg",
    license: { front: "/license-front-2.jpg", back: "/license-back-2.jpg" },
    vehicleDetails: {
      type: "Car",
      model: "Honda City",
      color: "Blue",
      registration: "JKL-012-MNO",
      photos: ["/vehicle-1.jpg", "/vehicle-2.jpg", "/vehicle-3.jpg"],
    },
  },
  {
    id: 5,
    name: "Ahmad Ali",
    email: "ahmad.ali@example.com",
    phone: "03123456794",
    dob: "1991-07-18",
    licenseNumber: "LHR8329",
    vehicle: "Toyota Corolla 2023",
    submittedDate: "2024-03-11",
    status: "Rejected",
    documents: ["License", "Insurance"],
    profilePhoto: "/profile-photo.jpg",
    cnic: { front: "/cnic-front.jpg", back: "/cnic-back.jpg" },
    selfieWithId: "/selfie-with-id.jpg",
    license: { front: "/license-front.jpg", back: "/license-back.jpg" },
    vehicleDetails: {
      type: "Car",
      model: "Toyota Corolla",
      color: "Red",
      registration: "PQR-345-STU",
      photos: ["/vehicle-1.jpg", "/vehicle-2.jpg", "/vehicle-3.jpg"],
    },
  },
];

export default function RequestsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  useEffect(() => {
    fetchPendingDrivers();
  }, []);

  const fetchPendingDrivers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/drivers/verification/pending`
      );
      const data = await response.json();
      setDrivers(data.drivers || []);
    } catch (error) {
      console.error("Failed to fetch pending drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter((driver) => {
    const fullName = `${driver.fullname.firstname} ${
      driver.fullname.lastname || ""
    }`;
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phoneNumber.includes(searchTerm);

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Pending" && driver.verificationStatus === "pending") ||
      (statusFilter === "Approved" &&
        driver.verificationStatus === "approved") ||
      (statusFilter === "Rejected" && driver.verificationStatus === "rejected");

    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (driverId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/drivers/${driverId}/verification`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verificationStatus: "approved" }),
        }
      );

      if (response.ok) {
        setDrivers(
          drivers.map((driver) =>
            driver._id === driverId
              ? { ...driver, verificationStatus: "approved" as const }
              : driver
          )
        );
        setSelectedDriver(null);
      }
    } catch (error) {
      console.error("Failed to approve driver:", error);
    }
  };

  const handleReject = async (driverId: string, reason?: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/drivers/${driverId}/verification`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationStatus: "rejected",
            rejectionReason: reason || "Documents not acceptable",
          }),
        }
      );

      if (response.ok) {
        setDrivers(
          drivers.map((driver) =>
            driver._id === driverId
              ? {
                  ...driver,
                  verificationStatus: "rejected" as const,
                  rejectionReason: reason,
                }
              : driver
          )
        );
        setSelectedDriver(null);
      }
    } catch (error) {
      console.error("Failed to reject driver:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "under review":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "under review":
        return <Eye className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const stats = {
    total: drivers.length,
    pending: drivers.filter((r) => r.verificationStatus === "pending").length,
    approved: drivers.filter((r) => r.verificationStatus === "approved").length,
    rejected: drivers.filter((r) => r.verificationStatus === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Driver Registration Requests
          </h1>
          <p className="text-muted-foreground mt-2">
            Review and manage driver registration applications
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
            <p className="text-xs text-muted-foreground">Verified drivers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
            <p className="text-xs text-muted-foreground">Not approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading drivers...
                    </TableCell>
                  </TableRow>
                ) : filteredDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No driver requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrivers.map((driver) => (
                    <TableRow key={driver._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {driver.fullname.firstname}{" "}
                            {driver.fullname.lastname || ""}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {driver.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {driver.phoneNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {driver.vehicle.company} {driver.vehicle.model} (
                        {driver.vehicle.color})
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {driver.documents?.cnic && (
                            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                              CNIC
                            </span>
                          )}
                          {driver.documents?.selfieWithId && (
                            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                              Selfie
                            </span>
                          )}
                          {driver.documents?.drivingLicense && (
                            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                              License
                            </span>
                          )}
                          {driver.profilePhoto && (
                            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                              Photo
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(driver.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(
                            driver.verificationStatus
                          )}`}
                        >
                          {getStatusIcon(driver.verificationStatus)}
                          {driver.verificationStatus}
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
                              onClick={() => setSelectedDriver(driver)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {driver.verificationStatus === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleApprove(driver._id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleReject(driver._id)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedDriver && (
        <DriverRequestModal
          request={{
            id: selectedDriver._id,
            name: `${selectedDriver.fullname.firstname} ${
              selectedDriver.fullname.lastname || ""
            }`,
            email: selectedDriver.email,
            phone: selectedDriver.phoneNumber,
            dob: selectedDriver.dateOfBirth || "N/A",
            submittedDate: new Date(
              selectedDriver.createdAt
            ).toLocaleDateString(),
            status:
              selectedDriver.verificationStatus.charAt(0).toUpperCase() +
              selectedDriver.verificationStatus.slice(1),
            documents: [
              ...(selectedDriver.documents?.cnic ? ["CNIC"] : []),
              ...(selectedDriver.documents?.selfieWithId ? ["Selfie"] : []),
              ...(selectedDriver.documents?.drivingLicense ? ["License"] : []),
              ...(selectedDriver.profilePhoto ? ["Profile Photo"] : []),
            ],
            profilePhoto: selectedDriver.profilePhoto?.url || "",
            cnic: {
              front: selectedDriver.documents?.cnic?.front?.url || "",
              back: selectedDriver.documents?.cnic?.back?.url || "",
            },
            selfieWithId: selectedDriver.documents?.selfieWithId?.url || "",
            license: {
              front: selectedDriver.documents?.drivingLicense?.front?.url || "",
              back: selectedDriver.documents?.drivingLicense?.back?.url || "",
            },
            vehicle: {
              type: selectedDriver.vehicle.vehicleType,
              model: `${selectedDriver.vehicle.company || ""} ${
                selectedDriver.vehicle.model || ""
              }`,
              color: selectedDriver.vehicle.color,
              registration: selectedDriver.vehicle.plate,
              photos:
                selectedDriver.vehicle.images?.map((img) => img.url) || [],
            },
          }}
          onClose={() => setSelectedDriver(null)}
          onApprove={() => handleApprove(selectedDriver._id)}
          onReject={(reason) => handleReject(selectedDriver._id, reason)}
        />
      )}
    </div>
  );
}
