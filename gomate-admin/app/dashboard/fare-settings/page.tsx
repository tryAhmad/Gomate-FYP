"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Bike, CarIcon, Loader2, Settings } from "lucide-react"

interface VehicleFare {
  baseFare: number
  perKmRate: number
  perMinuteRate: number
}

interface FareSettings {
  bike: VehicleFare
  rickshaw: VehicleFare
  car: VehicleFare
}

export default function FareSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const { toast } = useToast()

  const [fares, setFares] = useState<FareSettings>({
    bike: { baseFare: 0, perKmRate: 0, perMinuteRate: 0 },
    rickshaw: { baseFare: 0, perKmRate: 0, perMinuteRate: 0 },
    car: { baseFare: 0, perKmRate: 0, perMinuteRate: 0 },
  })

  // Fetch existing fare settings on page load
  useEffect(() => {
    const fetchFareSettings = async () => {
      try {
        setFetching(true)
        // Simulating API call - replace with actual endpoint
        // const response = await fetch('/api/fare-settings')
        // const data = await response.json()

        // Mock data for demonstration
        const mockData: FareSettings = {
          bike: { baseFare: 50, perKmRate: 10, perMinuteRate: 2 },
          rickshaw: { baseFare: 80, perKmRate: 15, perMinuteRate: 3 },
          car: { baseFare: 150, perKmRate: 25, perMinuteRate: 5 },
        }

        setFares(mockData)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch fare settings. Please try again.",
          variant: "destructive",
        })
      } finally {
        setFetching(false)
      }
    }

    fetchFareSettings()
  }, [toast])

  const handleInputChange = (vehicleType: keyof FareSettings, field: keyof VehicleFare, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setFares((prev) => ({
      ...prev,
      [vehicleType]: {
        ...prev[vehicleType],
        [field]: numValue,
      },
    }))
  }

  const validateFares = (): boolean => {
    for (const vehicleType of Object.keys(fares) as Array<keyof FareSettings>) {
      const fare = fares[vehicleType]
      if (fare.baseFare < 0 || fare.perKmRate < 0 || fare.perMinuteRate < 0) {
        toast({
          title: "Validation Error",
          description: "All fare values must be positive numbers.",
          variant: "destructive",
        })
        return false
      }
      if (fare.baseFare === 0 || fare.perKmRate === 0 || fare.perMinuteRate === 0) {
        toast({
          title: "Validation Error",
          description: "All fare values must be greater than zero.",
          variant: "destructive",
        })
        return false
      }
    }
    return true
  }

  const handleSave = async () => {
    if (!validateFares()) {
      return
    }

    try {
      setLoading(true)

      // Simulating API call - replace with actual endpoint
      // const response = await fetch('/api/fare-settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(fares),
      // })
      // if (!response.ok) throw new Error('Failed to save')

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Success",
        description: "Fare settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save fare settings. Please try again.",
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
    { key: "bike" as const, label: "Bike", icon: Bike, color: "text-blue-500" },
    { key: "rickshaw" as const, label: "Rickshaw", icon: CarIcon, color: "text-green-500" },
    { key: "car" as const, label: "Car", icon: CarIcon, color: "text-purple-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Fare Settings</h1>
          <p className="text-muted-foreground">Configure pricing for different vehicle types</p>
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
                  <CardDescription>Set rates for {label.toLowerCase()} rides</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${key}-baseFare`}>Base Fare (PKR)</Label>
                <Input
                  id={`${key}-baseFare`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={fares[key].baseFare}
                  onChange={(e) => handleInputChange(key, "baseFare", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${key}-perKm`}>Per Kilometer Rate (PKR)</Label>
                <Input
                  id={`${key}-perKm`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={fares[key].perKmRate}
                  onChange={(e) => handleInputChange(key, "perKmRate", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${key}-perMinute`}>Per Minute Rate (PKR)</Label>
                <Input
                  id={`${key}-perMinute`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={fares[key].perMinuteRate}
                  onChange={(e) => handleInputChange(key, "perMinuteRate", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Example fare (10km, 20min)</span>
                  <span className="font-semibold">
                    PKR {(fares[key].baseFare + fares[key].perKmRate * 10 + fares[key].perMinuteRate * 20).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
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
