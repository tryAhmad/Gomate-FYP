"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Users, Wallet, Clock, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { API_CONFIG } from "@/lib/api-config"

interface DriverPayment {
  _id: string
  fullname: {
    firstname: string
    lastname?: string
  }
  email: string
  phoneNumber: string
  vehicleType: string
  status: string
  accountStatus: 'active' | 'suspended'
  paymentStatus: 'paid' | 'pending' | 'overdue'
  lastPaymentDate: string | null
  weeklyFee: number
  totalEarnings: number
}

interface PaymentStats {
  totalDrivers: number
  paidThisWeek: number
  pendingPayments: number
  overduePayments: number
  suspendedAccounts: number
  totalRevenue: number
  expectedWeeklyFees: number
}

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [payments, setPayments] = useState<DriverPayment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPayments()
    fetchStatistics()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_CONFIG.BASE_URL}/payments`)
      const result = await response.json()
      
      if (response.ok && result.data) {
        setPayments(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error)
      toast({
        title: "Error",
        description: "Failed to fetch payment data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/payments/statistics`)
      const result = await response.json()
      
      if (response.ok && result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchPayments(), fetchStatistics()])
    setRefreshing(false)
    toast({
      title: "Success",
      description: "Payment data refreshed successfully.",
    })
  }

  const getDriverName = (payment: DriverPayment) => {
    const { firstname, lastname } = payment.fullname
    return `${firstname} ${lastname || ''}`.trim()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const filteredPayments = payments.filter((payment) => {
    const searchLower = searchTerm.toLowerCase()
    const driverName = getDriverName(payment).toLowerCase()
    return (
      driverName.includes(searchLower) ||
      payment.email.toLowerCase().includes(searchLower) ||
      payment.phoneNumber.includes(searchTerm)
    )
  })

  const markAsPaid = async (driverId: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/payments/${driverId}/mark-paid`, {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchPayments()
        await fetchStatistics()
        toast({
          title: "Success",
          description: "Payment marked as paid successfully.",
        })
      }
    } catch (error) {
      console.error('Failed to mark as paid:', error)
      toast({
        title: "Error",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleAccountStatus = async (driverId: string, currentStatus: string) => {
    try {
      const endpoint = currentStatus === 'active' ? 'suspend' : 'activate'
      const response = await fetch(`${API_CONFIG.BASE_URL}/payments/${driverId}/${endpoint}`, {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchPayments()
        await fetchStatistics()
        toast({
          title: "Success",
          description: `Account ${currentStatus === 'active' ? 'suspended' : 'activated'} successfully.`,
        })
      }
    } catch (error) {
      console.error('Failed to toggle account status:', error)
      toast({
        title: "Error",
        description: "Failed to update account status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <AlertCircle className="h-4 w-4" />
      case "overdue":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments & Fees</h1>
          <p className="text-muted-foreground mt-2">Manage driver weekly fees and payment status</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDrivers || 0}</div>
            <p className="text-xs text-muted-foreground">Active drivers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Week</CardTitle>
            <Wallet className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.paidThisWeek || 0}</div>
            <p className="text-xs text-muted-foreground">Weekly fees collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending/Overdue</CardTitle>
            <Clock className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(stats?.pendingPayments || 0) + (stats?.overduePayments || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {stats?.totalRevenue.toLocaleString() || 0}</div>
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
                  <TableRow key={payment._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getDriverName(payment)}</p>
                        <p className="text-sm text-muted-foreground">{payment.phoneNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{payment.email}</TableCell>
                    <TableCell className="font-medium">PKR {payment.weeklyFee}</TableCell>
                    <TableCell className="text-sm">{formatDate(payment.lastPaymentDate)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getPaymentStatusColor(payment.paymentStatus)}`}
                      >
                        {getPaymentStatusIcon(payment.paymentStatus)}
                        {getStatusLabel(payment.paymentStatus)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">PKR {payment.totalEarnings.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            payment.accountStatus === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {getStatusLabel(payment.accountStatus)}
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
                          <DropdownMenuItem onClick={() => markAsPaid(payment._id)}>
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            Mark as Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleAccountStatus(payment._id, payment.accountStatus)}>
                            {payment.accountStatus === "active" ? (
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
