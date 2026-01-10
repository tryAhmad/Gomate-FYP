"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DriverRequest {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  dob: string;
  submittedDate: string;
  status: string;
  documents: string[];
  profilePhoto: string;
  cnic: { front: string; back: string };
  selfieWithId: string;
  license: { front: string; back: string };
  vehicle: {
    type: string;
    model: string;
    color: string;
    registration: string;
    photos: string[];
  };
}

interface DriverRequestModalProps {
  request: DriverRequest;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onClose: () => void;
}

export function DriverRequestModal({
  request,
  onApprove,
  onReject,
  onClose,
}: DriverRequestModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(rejectionReason);
      setRejectionReason("");
      setShowRejectForm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-foreground">{request.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          {/* Personal Info */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Profile Photo
                </p>
                <img
                  src={request.profilePhoto || "/placeholder.svg"}
                  alt="Profile"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Phone</p>
                <p className="text-foreground font-medium">{request.phone}</p>
                <p className="text-sm text-muted-foreground mt-4">
                  Date of Birth
                </p>
                <p className="text-foreground font-medium">{request.dob}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Documents
            </h3>
            <div className="space-y-6">
              {/* CNIC */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">CNIC</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Front</p>
                    <img
                      src={request.cnic.front || "/placeholder.svg"}
                      alt="CNIC Front"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Back</p>
                    <img
                      src={request.cnic.back || "/placeholder.svg"}
                      alt="CNIC Back"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Selfie */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">
                  Selfie with ID
                </p>
                <img
                  src={request.selfieWithId || "/placeholder.svg"}
                  alt="Selfie"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>

              {/* License */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">
                  Driver's License
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Front</p>
                    <img
                      src={request.license.front || "/placeholder.svg"}
                      alt="License Front"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Back</p>
                    <img
                      src={request.license.back || "/placeholder.svg"}
                      alt="License Back"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Vehicle Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="text-foreground font-medium">
                  {request.vehicle.type}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="text-foreground font-medium">
                  {request.vehicle.model}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Color</p>
                <p className="text-foreground font-medium">
                  {request.vehicle.color}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registration</p>
                <p className="text-foreground font-medium">
                  {request.vehicle.registration}
                </p>
              </div>
            </div>
            <p className="text-sm font-medium text-foreground mb-3">
              Vehicle Photos
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {request.vehicle.photos.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo || "/placeholder.svg"}
                  alt={`Vehicle ${idx + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          {request.status.toLowerCase() === "pending" && (
            <div className="border-t border-border pt-6">
              {!showRejectForm ? (
                <div className="flex gap-3">
                  <Button
                    onClick={onApprove}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Approve Request
                  </Button>
                  <Button
                    onClick={() => setShowRejectForm(true)}
                    variant="destructive"
                    className="flex-1"
                  >
                    Reject Request
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                    className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={handleReject}
                      variant="destructive"
                      className="flex-1"
                    >
                      Confirm Rejection
                    </Button>
                    <Button
                      onClick={() => setShowRejectForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
