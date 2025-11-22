"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Trash2, Edit2, Eye, CheckCircle, XCircle } from "lucide-react"
import { API_CONFIG } from "@/lib/api-config"

interface Driver {
  _id: string
  fullname: {
    firstname: string
    lastname?: string
  }
  email: string
  phoneNumber: string
  status: 'active' | 'inactive'
  vehicle: {
    color: string
    plate: string
    capacity: number
    vehicleType: 'car' | 'motorcycle' | 'auto'
    company?: string
    model?: string
  }
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
  role: string
  createdAt: string
  updatedAt: string
}

export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [rideCounts, setRideCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDriversAndRides = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch drivers and ride counts in parallel
        const [driversResponse, rideCountsResponse] = await Promise.all([
          fetch(`${API_CONFIG.BASE_URL}/drivers`),
          fetch(`${API_CONFIG.BASE_URL}/statistics/driver-ride-counts`),
        ])
        
        if (!driversResponse.ok || !rideCountsResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const driversData = await driversResponse.json()
        const rideCountsData = await rideCountsResponse.json()
        
        setDrivers(driversData.drivers || [])
        setRideCounts(rideCountsData.data || {})
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDriversAndRides()
  }, [])

  const getDriverName = (driver: Driver) => {
    return `${driver.fullname.firstname} ${driver.fullname.lastname || ''}`.trim()
  }

  const getVehicleDescription = (vehicle: Driver['vehicle']) => {
    return `${vehicle.company || ''} ${vehicle.model || ''} (${vehicle.plate})`.trim()
  }

  const filteredDrivers = drivers.filter(
    (driver) =>
      getDriverName(driver).toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) {
      return
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/drivers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete driver')
      }

      setDrivers(drivers.filter((driver) => driver._id !== id))
    } catch (err) {
      console.error('Error deleting driver:', err)
      alert('Failed to delete driver')
    }
  }

  const handleStatusToggle = async (id: string, currentStatus: 'active' | 'inactive') => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      const response = await fetch(`${API_CONFIG.BASE_URL}/drivers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update driver status')
      }

      // Update local state
      setDrivers(drivers.map(driver => 
        driver._id === id ? { ...driver, status: newStatus } : driver
      ))
    } catch (err) {
      console.error('Error updating driver status:', err)
      alert('Failed to update driver status')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: 'active' | 'inactive') => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading drivers...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drivers Management</h1>
          <p className="text-muted-foreground mt-2">Manage and monitor all platform drivers</p>
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
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers.filter((d) => d.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers.filter((d) => d.status === "inactive").length}</div>
            <p className="text-xs text-muted-foreground">Not currently available</p>
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
                        <p className="text-sm text-muted-foreground">{driver.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{driver.phoneNumber}</TableCell>
                    <TableCell className="text-sm">{getVehicleDescription(driver.vehicle)}</TableCell>
                    <TableCell className="font-mono text-sm">{driver.vehicle.plate}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(driver.status)}`}
                      >
                        {capitalizeStatus(driver.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{rideCounts[driver._id] || 0}</span>
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
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusToggle(driver._id, driver.status)}>
                            {driver.status === 'active' ? (
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
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(driver._id)}>
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
    </div>
  )
}
