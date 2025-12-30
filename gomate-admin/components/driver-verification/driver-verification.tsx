"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, Eye } from "lucide-react";
import {
  Driver,
  getDriversByStatus,
  updateDriverVerification,
} from "@/lib/api/drivers";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function DriverVerification() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDrivers(activeTab);
  }, [activeTab]);

  const fetchDrivers = async (status: "pending" | "approved" | "rejected") => {
    setLoading(true);
    try {
      const data = await getDriversByStatus(status);
      setDrivers(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch drivers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (driver: Driver, action: "approve" | "reject") => {
    setSelectedDriver(driver);
    setActionType(action);

    if (action === "approve") {
      // Directly approve without modal
      await processVerification(driver._id, "approved");
    } else {
      // Show modal for rejection reason
      setShowModal(true);
    }
  };

  const processVerification = async (
    driverId: string,
    status: "approved" | "rejected",
    reason?: string
  ) => {
    setProcessing(true);
    try {
      await updateDriverVerification(driverId, status, reason);

      toast({
        title: "Success",
        description: `Driver ${
          status === "approved" ? "approved" : "rejected"
        } successfully`,
      });

      // Refresh the list
      await fetchDrivers(activeTab);
      setShowModal(false);
      setRejectionReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = () => {
    if (selectedDriver && rejectionReason.trim()) {
      processVerification(selectedDriver._id, "rejected", rejectionReason);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline"> = {
      pending: "outline",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Driver Document Verification</CardTitle>
          <CardDescription>Review and verify driver documents</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <TabsContent value="pending">
                  <DriverList
                    drivers={drivers}
                    onAction={handleAction}
                    showActions={true}
                  />
                </TabsContent>
                <TabsContent value="approved">
                  <DriverList
                    drivers={drivers}
                    onAction={handleAction}
                    showActions={false}
                  />
                </TabsContent>
                <TabsContent value="rejected">
                  <DriverList
                    drivers={drivers}
                    onAction={handleAction}
                    showActions={false}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Driver Verification</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting{" "}
              {selectedDriver?.fullname.firstname}&apos;s verification request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectionReason.trim() || processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Reject Driver"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DriverListProps {
  drivers: Driver[];
  onAction: (driver: Driver, action: "approve" | "reject") => void;
  showActions: boolean;
}

function DriverList({ drivers, onAction, showActions }: DriverListProps) {
  const [viewingDriver, setViewingDriver] = useState<Driver | null>(null);

  if (drivers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No drivers found
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 mt-4">
        {drivers.map((driver) => (
          <Card key={driver._id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">
                      {driver.fullname.firstname} {driver.fullname.lastname}
                    </h3>
                    <Badge
                      variant={
                        driver.verificationStatus === "pending"
                          ? "outline"
                          : driver.verificationStatus === "approved"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {driver.verificationStatus}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {driver.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {driver.phoneNumber}
                  </p>
                  {driver.rejectionReason && (
                    <p className="text-sm text-red-600">
                      <strong>Rejection Reason:</strong>{" "}
                      {driver.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingDriver(driver)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Documents
                  </Button>
                  {showActions && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onAction(driver, "approve")}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onAction(driver, "reject")}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document Viewer Modal */}
      <Dialog
        open={!!viewingDriver}
        onOpenChange={() => setViewingDriver(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Driver Documents - {viewingDriver?.fullname.firstname}{" "}
              {viewingDriver?.fullname.lastname}
            </DialogTitle>
          </DialogHeader>
          {viewingDriver?.documents && (
            <div className="space-y-6">
              {/* CNIC Images */}
              <div>
                <h4 className="font-semibold mb-2">CNIC</h4>
                <div className="grid grid-cols-2 gap-4">
                  {viewingDriver.documents.cnic?.front?.url && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Front
                      </p>
                      <Image
                        src={viewingDriver.documents.cnic.front.url}
                        alt="CNIC Front"
                        width={400}
                        height={250}
                        className="rounded-lg border"
                      />
                    </div>
                  )}
                  {viewingDriver.documents.cnic?.back?.url && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Back</p>
                      <Image
                        src={viewingDriver.documents.cnic.back.url}
                        alt="CNIC Back"
                        width={400}
                        height={250}
                        className="rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Selfie with ID */}
              {viewingDriver.documents.selfieWithId?.url && (
                <div>
                  <h4 className="font-semibold mb-2">Selfie with ID</h4>
                  <Image
                    src={viewingDriver.documents.selfieWithId.url}
                    alt="Selfie with ID"
                    width={400}
                    height={250}
                    className="rounded-lg border"
                  />
                </div>
              )}

              {/* Driving License */}
              <div>
                <h4 className="font-semibold mb-2">Driving License</h4>
                <div className="grid grid-cols-2 gap-4">
                  {viewingDriver.documents.drivingLicense?.front?.url && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Front
                      </p>
                      <Image
                        src={viewingDriver.documents.drivingLicense.front.url}
                        alt="License Front"
                        width={400}
                        height={250}
                        className="rounded-lg border"
                      />
                    </div>
                  )}
                  {viewingDriver.documents.drivingLicense?.back?.url && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Back</p>
                      <Image
                        src={viewingDriver.documents.drivingLicense.back.url}
                        alt="License Back"
                        width={400}
                        height={250}
                        className="rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
