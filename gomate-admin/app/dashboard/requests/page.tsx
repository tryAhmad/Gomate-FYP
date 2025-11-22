"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, CheckCircle, XCircle, Eye, Clock } from "lucide-react"
import { DriverRequestModal } from "@/components/driver-requests/driver-request-modal"

const mockRequests = [
  {
    id: 1,
    name: "Robert Taylor",
    email: "robert@example.com",
    phone: "+1234567890",
    dob: "1990-05-15",
    licenseNumber: "DL789012",
    vehicle: "BMW 3 Series 2023",
    submittedDate: "2024-03-15",
    status: "Pending",
    documents: ["License", "Insurance", "Registration"],
    profilePhoto: "/profile-photo.jpg",
    cnic: { front: "/cnic-front.jpg", back: "/cnic-back.jpg" },
    selfieWithId: "/selfie-with-id.jpg",
    license: { front: "/license-front.jpg", back: "/license-back.jpg" },
    vehicleDetails: {
      type: "Car",
      model: "BMW 3 Series",
      color: "Black",
      registration: "ABC-123-XYZ",
      photos: ["/vehicle-1.jpg", "/vehicle-2.jpg", "/vehicle-3.jpg"],
    },
  },
  {
    id: 2,
    name: "Lisa Anderson",
    email: "lisa@example.com",
    phone: "+1234567891",
    dob: "1992-08-22",
    licenseNumber: "DL789013",
    vehicle: "Audi A4 2022",
    submittedDate: "2024-03-14",
    status: "Under Review",
    documents: ["License", "Insurance", "Registration", "Background Check"],
    profilePhoto: "/profile-photo-2.jpg",
    cnic: { front: "/cnic-front-2.jpg", back: "/cnic-back-2.jpg" },
    selfieWithId: "/selfie-with-id-2.jpg",
    license: { front: "/license-front-2.jpg", back: "/license-back-2.jpg" },
    vehicleDetails: {
      type: "Car",
      model: "Audi A4",
      color: "Silver",
      registration: "DEF-456-UVW",
      photos: ["/vehicle-1.jpg", "/vehicle-2.jpg", "/vehicle-3.jpg"],
    },
  },
  {
    id: 3,
    name: "Thomas White",
    email: "thomas@example.com",
    phone: "+1234567892",
    dob: "1988-03-10",
    licenseNumber: "DL789014",
    vehicle: "Mercedes C-Class 2023",
    submittedDate: "2024-03-13",
    status: "Pending",
    documents: ["License", "Insurance"],
    profilePhoto: "/profile-photo.jpg",
    cnic: { front: "/cnic-front.jpg", back: "/cnic-back.jpg" },
    selfieWithId: "/selfie-with-id.jpg",
    license: { front: "/license-front.jpg", back: "/license-back.jpg" },
    vehicleDetails: {
      type: "Car",
      model: "Mercedes C-Class",
      color: "White",
      registration: "GHI-789-RST",
      photos: ["/vehicle-1.jpg", "/vehicle-2.jpg", "/vehicle-3.jpg"],
    },
  },
  {
    id: 4,
    name: "Jennifer Lee",
    email: "jennifer@example.com",
    phone: "+1234567893",
    dob: "1995-11-30",
    licenseNumber: "DL789015",
    vehicle: "Volkswagen Jetta 2022",
    submittedDate: "2024-03-12",
    status: "Approved",
    documents: ["License", "Insurance", "Registration", "Background Check"],
    profilePhoto: "/profile-photo-2.jpg",
    cnic: { front: "/cnic-front-2.jpg", back: "/cnic-back-2.jpg" },
    selfieWithId: "/selfie-with-id-2.jpg",
    license: { front: "/license-front-2.jpg", back: "/license-back-2.jpg" },
    vehicleDetails: {
      type: "Car",
      model: "Volkswagen Jetta",
      color: "Blue",
      registration: "JKL-012-MNO",
      photos: ["/vehicle-1.jpg", "/vehicle-2.jpg", "/vehicle-3.jpg"],
    },
  },
  {
    id: 5,
    name: "Christopher Davis",
    email: "chris@example.com",
    phone: "+1234567894",
    dob: "1991-07-18",
    licenseNumber: "DL789016",
    vehicle: "Mazda CX-5 2023",
    submittedDate: "2024-03-11",
    status: "Rejected",
    documents: ["License", "Insurance"],
    profilePhoto: "/profile-photo.jpg",
    cnic: { front: "/cnic-front.jpg", back: "/cnic-back.jpg" },
    selfieWithId: "/selfie-with-id.jpg",
    license: { front: "/license-front.jpg", back: "/license-back.jpg" },
    vehicleDetails: {
      type: "Car",
      model: "Mazda CX-5",
      color: "Red",
      registration: "PQR-345-STU",
      photos: ["/vehicle-1.jpg", "/vehicle-2.jpg", "/vehicle-3.jpg"],
    },
  },
]

export default function RequestsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [requests, setRequests] = useState(mockRequests)
  const [selectedRequest, setSelectedRequest] = useState<(typeof mockRequests)[0] | null>(null)

  const filteredRequests = requests.filter(
    (request) =>
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleApprove = (id: number) => {
    setRequests(requests.map((req) => (req.id === id ? { ...req, status: "Approved" } : req)))
    setSelectedRequest(null)
  }

  const handleReject = (id: number) => {
    setRequests(requests.map((req) => (req.id === id ? { ...req, status: "Rejected" } : req)))
    setSelectedRequest(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Under Review":
        return "bg-blue-100 text-blue-800"
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4" />
      case "Under Review":
        return <Eye className="h-4 w-4" />
      case "Approved":
        return <CheckCircle className="h-4 w-4" />
      case "Rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "Pending").length,
    underReview: requests.filter((r) => r.status === "Under Review").length,
    approved: requests.filter((r) => r.status === "Approved").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Registration Requests</h1>
          <p className="text-muted-foreground mt-2">Review and manage driver registration applications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
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
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.underReview}</div>
            <p className="text-xs text-muted-foreground">Being processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
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
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.name}</p>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{request.licenseNumber}</TableCell>
                    <TableCell className="text-sm">{request.vehicle}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {request.documents.map((doc) => (
                          <span
                            key={doc}
                            className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium"
                          >
                            {doc}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{request.submittedDate}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(request.status)}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status}
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
                          <DropdownMenuItem onClick={() => setSelectedRequest(request)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {request.status === "Pending" || request.status === "Under Review" ? (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(request.id)}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleReject(request.id)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No requests found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRequest && (
        <DriverRequestModal
          request={{
            id: selectedRequest.id,
            name: selectedRequest.name,
            phone: selectedRequest.phone,
            dob: selectedRequest.dob,
            profilePhoto: selectedRequest.profilePhoto,
            cnic: selectedRequest.cnic,
            selfieWithId: selectedRequest.selfieWithId,
            license: selectedRequest.license,
            vehicle: {
              type: selectedRequest.vehicleDetails.type,
              model: selectedRequest.vehicleDetails.model,
              color: selectedRequest.vehicleDetails.color,
              registration: selectedRequest.vehicleDetails.registration,
              photos: selectedRequest.vehicleDetails.photos,
            },
            status: selectedRequest.status,
          }}
          onApprove={() => handleApprove(selectedRequest.id)}
          onReject={() => handleReject(selectedRequest.id)}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  )
}
