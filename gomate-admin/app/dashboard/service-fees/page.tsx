"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Bike, Car, Loader2, DollarSign } from "lucide-react"
import { API_CONFIG } from "@/lib/api-config"

interface ServiceFee {
  weeklyFee: number
}

interface ServiceFees {
  car: ServiceFee
  motorcycle: ServiceFee
  auto: ServiceFee
}

export default function ServiceFeesPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const { toast } = useToast()

  const [fees, setFees] = useState<ServiceFees>({
    car: { weeklyFee: 0 },
    motorcycle: { weeklyFee: 0 },
    auto: { weeklyFee: 0 },
  })

  // Fetch existing service fees on page load
  useEffect(() => {
    const fetchServiceFees = async () => {
      try {
        setFetching(true)
        const response = await fetch(`${API_CONFIG.BASE_URL}/service-fees`)
        const result = await response.json()

        if (response.ok && result.data) {
          // Convert array to object format
          const feeData: ServiceFees = {
            car: { weeklyFee: 0 },
            motorcycle: { weeklyFee: 0 },
            auto: { weeklyFee: 0 },
          }

          result.data.forEach((item: any) => {
            if (item.vehicleType in feeData) {
              feeData[item.vehicleType as keyof ServiceFees] = {
                weeklyFee: item.weeklyFee,
              }
            }
          })

          setFees(feeData)
        }
      } catch (error) {
        console.error('Failed to fetch service fees:', error)
        toast({
          title: "Error",
          description: "Failed to fetch service fees. Please try again.",
          variant: "destructive",
        })
      } finally {
        setFetching(false)
      }
    }

    fetchServiceFees()
  }, [toast])

  const handleInputChange = (vehicleType: keyof ServiceFees, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setFees((prev) => ({
      ...prev,
      [vehicleType]: {
        weeklyFee: numValue,
      },
    }))
  }

  const validateFees = (): boolean => {
    for (const vehicleType of Object.keys(fees) as Array<keyof ServiceFees>) {
      const fee = fees[vehicleType]
      if (fee.weeklyFee < 0) {
        toast({
          title: "Validation Error",
          description: "All fee values must be positive numbers.",
          variant: "destructive",
        })
        return false
      }
      if (fee.weeklyFee === 0) {
        toast({
          title: "Validation Error",
          description: "All fee values must be greater than zero.",
          variant: "destructive",
        })
        return false
      }
    }
    return true
  }

  const handleSave = async () => {
    if (!validateFees()) {
      return
    }

    try {
      setLoading(true)

      // Update each vehicle type separately
      const updatePromises = Object.entries(fees).map(([vehicleType, feeData]) => {
        return fetch(`${API_CONFIG.BASE_URL}/service-fees/${vehicleType}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feeData),
        })
      })

      const responses = await Promise.all(updatePromises)
      const allSuccessful = responses.every((res) => res.ok)

      if (!allSuccessful) {
        throw new Error('Failed to update some service fees')
      }

      toast({
        title: "Success",
        description: "Weekly service fees have been updated successfully.",
      })
    } catch (error) {
      console.error('Failed to save service fees:', error)
      toast({
        title: "Error",
        description: "Failed to save service fees. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const vehicleConfig = [
    { key: "car" as const, label: "Car", icon: Car, color: "text-purple-500" },
    { key: "motorcycle" as const, label: "Motorcycle", icon: Bike, color: "text-blue-500" },
    { key: "auto" as const, label: "Auto Rickshaw", icon: Car, color: "text-green-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Weekly Service Fees</h1>
          <p className="text-muted-foreground">Manage weekly service charges for drivers by vehicle type</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {vehicleConfig.map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-lg bg-card flex items-center justify-center border border-border ${color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>{label}</CardTitle>
                  <CardDescription>Weekly fee for {label.toLowerCase()} drivers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${key}-weeklyFee`}>Weekly Service Fee (PKR)</Label>
                <Input
                  id={`${key}-weeklyFee`}
                  type="number"
                  min="0"
                  step="1"
                  value={fees[key].weeklyFee}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  placeholder="0"
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Amount charged to drivers every week
                </p>
              </div>

              <div className="pt-2 border-t border-border bg-muted/50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Monthly estimate</span>
                  <span className="text-sm font-semibold">
                    PKR {(fees[key].weeklyFee * 4).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-muted-foreground">Yearly estimate</span>
                  <span className="text-sm font-semibold">
                    PKR {(fees[key].weeklyFee * 52).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-blue-600 dark:text-blue-400 text-sm">ℹ</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Important Information</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• These fees are charged to drivers on a weekly basis</li>
                <li>• Changes take effect immediately after saving</li>
                <li>• All amounts are in Pakistani Rupees (PKR)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => window.location.reload()}
        >
          Reset Changes
        </Button>
        <Button onClick={handleSave} disabled={loading} size="lg" className="min-w-[200px]">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  )
}
