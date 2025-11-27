"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2, MapPin, User, Car, DollarSign, Clock, Calendar } from "lucide-react"
import { API_CONFIG } from "@/lib/api-config"
import { reverseGeocode } from "@/lib/geocoding"

interface RideDetailsModalProps {
  rideId: string
  open: boolean
  onClose: () => void
}

interface RideDetails {
  _id: string
  passengerID: {
    _id: string
    username: string
    email: string
    phoneNumber: string
  } | null
  driverID: {
    _id: string
    fullname: {
      firstname: string
      lastname?: string
    }
    email: string
    phoneNumber: string
    vehicle: {
      color: string
      plate: string
      capacity: number
      vehicleType: string
      company?: string
      model?: string
    }
    status: string
  } | null
  pickupLocation: {
    type: string
    coordinates: [number, number]
  }
  dropoffLocation: {
    type: string
    coordinates: [number, number]
  }
  rideType: string
  rideMode: string
  fare: number
  status: string
  createdAt: string
  updatedAt: string
}

export function RideDetailsModal({ rideId, open, onClose }: RideDetailsModalProps) {
  const [ride, setRide] = useState<RideDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickupAddress, setPickupAddress] = useState<string | null>(null)
  const [dropoffAddress, setDropoffAddress] = useState<string | null>(null)
  const [addressLoading, setAddressLoading] = useState(false)

  useEffect(() => {
    if (open && rideId) {
      fetchRideDetails()
    }
  }, [open, rideId])

  useEffect(() => {
    if (ride && open) {
      fetchAddresses()
    }
  }, [ride, open])

  const fetchRideDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_CONFIG.BASE_URL}/statistics/ride/${rideId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ride details (${response.status})`)
      }
      
      const data = await response.json()
      setRide(data.data)
    } catch (err) {
      console.error("Error fetching ride details:", err)
      setError(err instanceof Error ? err.message : "Failed to load ride details")
    } finally {
      setLoading(false)
    }
  }

  const fetchAddresses = async () => {
    if (!ride) return

    setAddressLoading(true)
    setPickupAddress(null)
    setDropoffAddress(null)

    try {
      // Fetch both addresses in parallel
      const [pickup, dropoff] = await Promise.all([
        reverseGeocode(
          ride.pickupLocation.coordinates[1],
          ride.pickupLocation.coordinates[0]
        ),
        reverseGeocode(
          ride.dropoffLocation.coordinates[1],
          ride.dropoffLocation.coordinates[0]
        ),
      ])

      setPickupAddress(pickup)
      setDropoffAddress(dropoff)
    } catch (err) {
      console.error("Error fetching addresses:", err)
      // Don't set error state, just leave addresses as null (will show coordinates as fallback)
    } finally {
      setAddressLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatLocation = (coordinates: [number, number]) => {
    return `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`
  }

  const getDriverName = () => {
    if (!ride?.driverID) return "No Driver Assigned"
    const { firstname, lastname } = ride.driverID.fullname
    return `${firstname} ${lastname || ''}`.trim()
  }

  const getVehicleDescription = () => {
    if (!ride?.driverID?.vehicle) return "N/A"
    const { color, company, model, vehicleType } = ride.driverID.vehicle
    return `${color || ''} ${company || ''} ${model || ''} (${vehicleType})`.trim()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "started":
      case "accepted":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "matched":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ride Details</DialogTitle>
          <DialogDescription>
            Complete information about the selected ride
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 font-semibold mb-2">Error Loading Ride</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : ride ? (
          <div className="space-y-6">
            {/* Ride Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
                <Car className="h-5 w-5" />
                <span>Ride Information</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Ride ID</Label>
                  <p className="font-mono text-sm font-semibold">
                    {ride._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(ride.status)}`}
                  >
                    {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Ride Type</Label>
                  <p className="text-sm font-medium">{ride.rideType}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Ride Mode</Label>
                  <p className="text-sm font-medium">{ride.rideMode}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Fare Amount</Label>
                  <p className="text-sm font-semibold flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    PKR {ride.fare.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Created At</Label>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateTime(ride.createdAt)}
                  </p>
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-green-600" />
                    Pickup Location
                  </Label>
                  {addressLoading ? (
                    <div className="bg-secondary px-3 py-2 rounded flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Loading address...</span>
                    </div>
                  ) : pickupAddress ? (
                    <div className="space-y-1">
                      <p className="text-sm bg-secondary px-3 py-2 rounded">
                        {pickupAddress}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground px-1">
                        {formatLocation(ride.pickupLocation.coordinates)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-mono bg-secondary px-3 py-2 rounded">
                      {formatLocation(ride.pickupLocation.coordinates)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-red-600" />
                    Dropoff Location
                  </Label>
                  {addressLoading ? (
                    <div className="bg-secondary px-3 py-2 rounded flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Loading address...</span>
                    </div>
                  ) : dropoffAddress ? (
                    <div className="space-y-1">
                      <p className="text-sm bg-secondary px-3 py-2 rounded">
                        {dropoffAddress}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground px-1">
                        {formatLocation(ride.dropoffLocation.coordinates)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-mono bg-secondary px-3 py-2 rounded">
                      {formatLocation(ride.dropoffLocation.coordinates)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Passenger Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
                <User className="h-5 w-5" />
                <span>Passenger Information</span>
              </div>
              
              {ride.passengerID ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Name</Label>
                    <p className="text-sm font-medium">{ride.passengerID.username}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Passenger ID</Label>
                    <p className="text-sm font-mono">{ride.passengerID._id.slice(-8).toUpperCase()}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Email</Label>
                    <p className="text-sm">{ride.passengerID.email}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Phone Number</Label>
                    <p className="text-sm font-medium">{ride.passengerID.phoneNumber}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No passenger information available</p>
              )}
            </div>

            {/* Driver Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
                <Car className="h-5 w-5" />
                <span>Driver Information</span>
              </div>
              
              {ride.driverID ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Name</Label>
                      <p className="text-sm font-medium">{getDriverName()}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Driver ID</Label>
                      <p className="text-sm font-mono">{ride.driverID._id.slice(-8).toUpperCase()}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Email</Label>
                      <p className="text-sm">{ride.driverID.email}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Phone Number</Label>
                      <p className="text-sm font-medium">{ride.driverID.phoneNumber}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Driver Status</Label>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ride.driverID.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ride.driverID.status.charAt(0).toUpperCase() + ride.driverID.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-semibold">Vehicle Details</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Vehicle</Label>
                        <p className="text-sm font-medium">{getVehicleDescription()}</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">License Plate</Label>
                        <p className="text-sm font-mono font-semibold">{ride.driverID.vehicle.plate}</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Capacity</Label>
                        <p className="text-sm">{ride.driverID.vehicle.capacity} passengers</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No driver assigned yet</p>
              )}
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold border-b pb-2">
                <Clock className="h-4 w-4" />
                <span>Timeline</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{formatDateTime(ride.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium">{formatDateTime(ride.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
