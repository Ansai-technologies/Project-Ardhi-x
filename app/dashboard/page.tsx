"use client"

import type { Metadata } from "next"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, MapPin, FileText, AlertCircle, ChevronRight, Plus } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function DashboardPage() {
  const { user, getUserStats, getUserProperties, loading } = useAuth()
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Welcome to ArdhiX</h2>
            <p className="text-muted-foreground">Please log in to access your dashboard.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const stats = getUserStats()
  const properties = getUserProperties()
  const recentProperties = properties.slice(0, 2)

  // Check if user is new (account created within the last minute)
  const isNewUser = (() => {
    if (!user || !user.dateJoined) return false;
    const joined = new Date(user.dateJoined);
    const now = new Date();
    return (now.getTime() - joined.getTime()) < 60 * 1000;
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {isNewUser ? 'Welcome to ArdhiX!' : `Welcome back, ${user.name}!`}
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your land registry activities and properties.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Properties</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalProperties === 0 && "No properties yet"}
                {stats.totalProperties === 1 && "1 property in portfolio"}
                {stats.totalProperties > 1 && `${stats.totalProperties} properties in portfolio`}
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingDocuments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingDocuments === 0 && "All documents verified"}
                {stats.pendingDocuments > 0 && "Awaiting verification"}
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${stats.verifiedProperties === stats.totalProperties && stats.totalProperties > 0 ? 'bg-green-500' : stats.totalProperties === 0 ? 'bg-gray-400' : 'bg-yellow-500'}`}></div>
                <span className="text-sm font-medium">
                  {stats.totalProperties === 0 ? "No Properties" : `${stats.verifiedProperties}/${stats.totalProperties} Verified`}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Properties</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/properties" className="flex items-center gap-1">
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {properties.length > 0 ? (
              properties.slice(0, 2).map((property) => (
                <Card key={property.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex flex-col space-y-1.5">
                        <h3 className="text-lg font-semibold">{property.title}</h3>
                        <p className="text-sm text-muted-foreground">{property.size} • {property.location}</p>
                      </div>
                      <div className="flex items-center mt-4 mb-6">
                        <Badge variant="outline" className={`flex items-center gap-1 ${
                          property.status === 'verified' 
                            ? 'text-green-600 border-green-600' 
                            : property.status === 'pending'
                            ? 'text-yellow-600 border-yellow-600'
                            : 'text-red-600 border-red-600'
                        }`}>
                          {property.status === 'verified' && <CheckCircle className="h-3 w-3" />}
                          {property.status === 'pending' && <Clock className="h-3 w-3" />}
                          {property.status === 'rejected' && <AlertCircle className="h-3 w-3" />}
                          {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          Updated {new Date(property.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <Link href={`/properties/${property.id}`}>View Details</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <Link href={`/map?id=${property.id}`}>View on Map</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="overflow-hidden transition-all hover:shadow-md col-span-full">
                <CardContent className="p-8 text-center">
                  <div className="mb-4">
                    <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start building your land portfolio by adding your first property.
                  </p>
                  <Button asChild>
                    <Link href="/properties/add">Add Your First Property</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/history" className="flex items-center gap-1">
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {properties.length > 0 ? (
                <div className="divide-y">
                  {properties.slice(0, 3).map((property, index) => (
                    <div key={property.id} className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-medium">
                          {property.status === 'verified' ? 'Property Verified' : 
                           property.status === 'pending' ? 'Document Pending Review' : 
                           'Property Added'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {property.title} • {new Date(property.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className={
                        property.status === 'verified' ? 'text-green-600 border-green-600' :
                        property.status === 'pending' ? 'text-yellow-600 border-yellow-600' :
                        'text-gray-600 border-gray-600'
                      }>
                        {property.status === 'verified' ? 'Completed' :
                         property.status === 'pending' ? 'Pending Review' :
                         'Draft'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                  </div>
                  <h3 className="font-medium mb-2">No Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Your property activities will appear here once you start adding properties.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
