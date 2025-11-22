"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

const mockUsers = [
  { id: 1, name: "Ahmed Hassan", email: "ahmed@example.com", phone: "+92 300 1234567", rides: 45, status: "active" },
  { id: 2, name: "Fatima Khan", email: "fatima@example.com", phone: "+92 300 2345678", rides: 32, status: "active" },
  { id: 3, name: "Ali Raza", email: "ali@example.com", phone: "+92 300 3456789", rides: 18, status: "inactive" },
  { id: 4, name: "Zainab Ahmed", email: "zainab@example.com", phone: "+92 300 4567890", rides: 67, status: "active" },
  { id: 5, name: "Hassan Ali", email: "hassan@example.com", phone: "+92 300 5678901", rides: 23, status: "active" },
]

export function UsersTable() {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Rides</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((user) => (
              <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 text-sm text-foreground font-medium">{user.name}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{user.phone}</td>
                <td className="px-6 py-4 text-sm text-foreground">{user.rides}</td>
                <td className="px-6 py-4 text-sm">
                  <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
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
