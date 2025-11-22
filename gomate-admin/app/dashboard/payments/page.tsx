"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, CheckCircle, XCircle, AlertCircle } from "lucide-react"

const mockPayments = [
  {
    id: 1,
    driverName: "Robert Taylor",
    email: "robert@example.com",
    phone: "+1234567890",
    weeklyFee: 50,
    lastPaymentDate: "2024-03-15",
    paymentStatus: "Paid",
    accountStatus: "Active",
    totalEarnings: 2500,
  },
  {
    id: 2,
    driverName: "Lisa Anderson",
    email: "lisa@example.com",
    phone: "+1234567891",
    weeklyFee: 50,
    lastPaymentDate: "2024-03-08",
    paymentStatus: "Pending",
    accountStatus: "Active",
    totalEarnings: 1800,
  },
  {
    id: 3,
    driverName: "Thomas White",
    email: "thomas@example.com",
    phone: "+1234567892",
    weeklyFee: 50,
    lastPaymentDate: "2024-03-01",
    paymentStatus: "Overdue",
    accountStatus: "Active",
    totalEarnings: 3200,
  },
  {
    id: 4,
    driverName: "Jennifer Lee",
    email: "jennifer@example.com",
    phone: "+1234567893",
    weeklyFee: 50,
    lastPaymentDate: "2024-03-15",
    paymentStatus: "Paid",
    accountStatus: "Active",
    totalEarnings: 2100,
  },
  {
    id: 5,
    driverName: "Christopher Davis",
    email: "chris@example.com",
    phone: "+1234567894",
    weeklyFee: 50,
    lastPaymentDate: null,
    paymentStatus: "Pending",
    accountStatus: "Suspended",
    totalEarnings: 900,
  },
  {
    id: 6,
    driverName: "Sarah Martinez",
    email: "sarah@example.com",
    phone: "+1234567895",
    weeklyFee: 50,
    lastPaymentDate: "2024-03-10",
    paymentStatus: "Paid",
    accountStatus: "Active",
    totalEarnings: 2800,
  },
]

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [payments, setPayments] = useState(mockPayments)

  const filteredPayments = payments.filter(
    (payment) =>
      payment.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.phone.includes(searchTerm),
  )

  const toggleAccountStatus = (id: number) => {
    setPayments(
      payments.map((payment) =>
        payment.id === id
          ? {
              ...payment,
              accountStatus: payment.accountStatus === "Active" ? "Suspended" : "Active",
            }
          : payment,
      ),
    )
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="h-4 w-4" />
      case "Pending":
        return <AlertCircle className="h-4 w-4" />
      case "Overdue":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const stats = {
    totalDrivers: payments.length,
    paidThisWeek: payments.filter((p) => p.paymentStatus === "Paid").length,
    pendingPayments: payments.filter((p) => p.paymentStatus === "Pending" || p.paymentStatus === "Overdue").length,
    totalRevenue: payments.reduce((sum, p) => sum + p.totalEarnings, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments & Fees</h1>
          <p className="text-muted-foreground mt-2">Manage driver weekly fees and payment status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDrivers}</div>
            <p className="text-xs text-muted-foreground">Active drivers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidThisWeek}</div>
            <p className="text-xs text-muted-foreground">Weekly fees collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending/Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Driver earnings</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by driver name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Weekly Fee</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Total Earnings</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.driverName}</p>
                        <p className="text-sm text-muted-foreground">{payment.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{payment.email}</TableCell>
                    <TableCell className="font-medium">${payment.weeklyFee}</TableCell>
                    <TableCell className="text-sm">{payment.lastPaymentDate || "Never"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getPaymentStatusColor(payment.paymentStatus)}`}
                      >
                        {getPaymentStatusIcon(payment.paymentStatus)}
                        {payment.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">${payment.totalEarnings.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            payment.accountStatus === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {payment.accountStatus}
                        </span>
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
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            Mark as Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleAccountStatus(payment.id)}>
                            {payment.accountStatus === "Active" ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                Suspend Account
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Activate Account
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Send Payment Reminder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No drivers found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
