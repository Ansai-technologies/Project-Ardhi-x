export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  avatar?: string
  phone?: string
  nationalId?: string
  bio?: string
  location?: string
  dateJoined: string
  isVerified?: boolean
  isFirstLogin?: boolean
}

export interface Property {
  id: string
  userId: string
  title: string
  type: 'residential' | 'commercial' | 'agricultural' | 'industrial'
  location: string
  size: string
  status: 'verified' | 'pending' | 'rejected'
  value: number
  currency: string
  documents: PropertyDocument[]
  coordinates?: {
    lat: number
    lng: number
  }
  createdAt: string
  updatedAt: string
}

export interface PropertyDocument {
  id: string
  propertyId: string
  name: string
  type: 'title_deed' | 'survey_map' | 'valuation' | 'tax_receipt' | 'other'
  url: string
  status: 'pending' | 'approved' | 'rejected'
  uploadedAt: string
}

export interface UserStats {
  totalProperties: number
  verifiedProperties: number
  pendingProperties: number
  pendingDocuments: number
  totalValue: number
  currency: string
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>
  uploadAvatar: (file: File) => Promise<string>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  getUserStats: () => UserStats
  getUserProperties: () => Property[]
  addProperty: (property: Omit<Property, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>
  loading: boolean
}

export interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
  nationalId?: string
}

export interface LoginResponse {
  success: boolean
  user?: User
  token?: string
  error?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface DocumentAction {
  id: string
  userId: string
  userName: string
  documentId: string
  documentName: string
  action: 'upload' | 'delete' | 'download' | 'verify' | 'reject'
  description: string
  timestamp: string
  metadata?: {
    fileSize?: number
    fileType?: string
    propertyId?: string
    verificationNotes?: string
  }
}

export interface SystemActivity extends DocumentAction {
  userEmail: string
  ipAddress?: string
  userAgent?: string
}
