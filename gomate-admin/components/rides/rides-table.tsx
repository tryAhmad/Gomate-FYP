"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const mockRides = [
  {
    id: "R001",
    rider: "Ahmed Hassan",
    driver: "Muhammad Usman",
    fare: "Rs. 450",
    status: "completed",
    from: "Gulshan",
    to: "Clifton",
  },
  {
    id: "R002",
    rider: "Fatima Khan",
    driver: "Bilal Ahmed",
    fare: "Rs. 320",
    status: "active",
    from: "DHA",
    to: "Karachi Airport",
  },
  {
    id: "R003",
    rider: "Ali Raza",
    driver: "Samir Khan",
    fare: "Rs. 280",
    status: "completed",
    from: "Saddar",
    to: "Tariq Road",
  },
  {
    id: "R004",
    rider: "Zainab Ahmed",
    driver: "Rashid Ali",
    fare: "Rs. 150",
    status: "cancelled",
    from: "Zamzama",
    to: "Boat Basin",
  },
  {
    id: "R005",
    rider: "Hassan Ali",
    driver: "Karim Hassan",
    fare: "Rs. 520",
    status: "active",
    from: "Malir",
    to: "Gulshan",
  },
]

export function RidesTable() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "completed":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Ride ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Rider</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Driver</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Route</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Fare</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockRides.map((ride) => (
              <tr key={ride.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 text-sm text-foreground font-medium">{ride.id}</td>
                <td className="px-6 py-4 text-sm text-foreground">{ride.rider}</td>
                <td className="px-6 py-4 text-sm text-foreground">{ride.driver}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {ride.from} → {ride.to}
                </td>
                <td className="px-6 py-4 text-sm text-foreground font-medium">{ride.fare}</td>
                <td className="px-6 py-4 text-sm">
                  <Badge variant={getStatusColor(ride.status)}>{ride.status}</Badge>
                </td>
                <td className="px-6 py-4 text-sm">
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
