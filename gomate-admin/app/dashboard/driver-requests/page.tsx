import { DriverRequestsList } from "@/components/driver-requests/driver-requests-list"

export default function DriverRequestsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Driver Registration Requests</h1>
        <p className="text-muted-foreground mt-2">Review and manage driver signup requests</p>
      </div>
      <DriverRequestsList />
    </div>
  )
}
