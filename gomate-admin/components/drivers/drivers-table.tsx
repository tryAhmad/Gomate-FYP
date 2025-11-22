"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

const mockDrivers = [
  { id: 1, name: "Muhammad Usman", phone: "+92 300 1111111", rating: 4.8, rides: 234, vehicle: "Car" },
  { id: 2, name: "Bilal Ahmed", phone: "+92 300 2222222", rating: 4.6, rides: 189, vehicle: "Bike" },
  { id: 3, name: "Samir Khan", phone: "+92 300 3333333", rating: 4.9, rides: 312, vehicle: "Car" },
  { id: 4, name: "Rashid Ali", phone: "+92 300 4444444", rating: 4.5, rides: 156, vehicle: "Rickshaw" },
  { id: 5, name: "Karim Hassan", phone: "+92 300 5555555", rating: 4.7, rides: 267, vehicle: "Car" },
]

export function DriversTable() {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Rating</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Total Rides</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Vehicle Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockDrivers.map((driver) => (
              <tr key={driver.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 text-sm text-foreground font-medium">{driver.name}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{driver.phone}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-foreground">{driver.rating}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-foreground">{driver.rides}</td>
                <td className="px-6 py-4 text-sm">
                  <Badge variant="outline">{driver.vehicle}</Badge>
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
