"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { DriverRequestModal } from "./driver-request-modal"

const mockRequests = [
  {
    id: 1,
    name: "Tariq Mahmood",
    phone: "+92 300 9876543",
    dob: "1990-05-15",
    profilePhoto: "/profile-photo.jpg",
    cnic: { front: "/cnic-front.jpg", back: "/cnic-back.jpg" },
    selfieWithId: "/selfie-with-id.jpg",
    license: { front: "/license-front.jpg", back: "/license-back.jpg" },
    vehicle: {
      type: "Car",
      model: "Honda Civic",
      color: "Silver",
      registration: "ABC-123",
      photos: ["/vehicle-1.jpg", "/vehicle-2.jpg"],
    },
    status: "pending",
  },
  {
    id: 2,
    name: "Amina Fatima",
    phone: "+92 300 8765432",
    dob: "1992-08-22",
    profilePhoto: "/profile-photo-2.jpg",
    cnic: { front: "/cnic-front-2.jpg", back: "/cnic-back-2.jpg" },
    selfieWithId: "/selfie-with-id-2.jpg",
    license: { front: "/license-front-2.jpg", back: "/license-back-2.jpg" },
    vehicle: {
      type: "Bike",
      model: "Honda CB 150",
      color: "Black",
      registration: "XYZ-789",
      photos: ["/vehicle-3.jpg"],
    },
    status: "pending",
  },
]

export function DriverRequestsList() {
  const [selectedRequest, setSelectedRequest] = useState<(typeof mockRequests)[0] | null>(null)
  const [requests, setRequests] = useState(mockRequests)

  const handleApprove = (id: number) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: "approved" } : r)))
    setSelectedRequest(null)
  }

  const handleReject = (id: number, reason: string) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)))
    setSelectedRequest(null)
  }

  return (
    <>
      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">{request.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{request.phone}</p>
                <p className="text-sm text-muted-foreground">DOB: {request.dob}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Vehicle: {request.vehicle.type} - {request.vehicle.model}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    request.status === "pending" ? "default" : request.status === "approved" ? "default" : "destructive"
                  }
                >
                  {request.status}
                </Badge>
                <Button onClick={() => setSelectedRequest(request)} variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedRequest && (
        <DriverRequestModal
          request={selectedRequest}
          onApprove={() => handleApprove(selectedRequest.id)}
          onReject={(reason) => handleReject(selectedRequest.id, reason)}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </>
  )
}
