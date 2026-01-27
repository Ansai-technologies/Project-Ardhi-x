import { Property, PropertyDocument, UserStats } from '@/types/auth'
import { supabaseAdmin } from './supabase'
import { logger } from './logger'

// Database-backed property service using Supabase
export class PropertyService {
  static async getAllProperties(): Promise<Property[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('properties')
        .select(`
          *,
          property_documents (*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Error fetching all properties', error)
        throw error
      }

      return this.mapPropertiesToDomain(data || [])
    } catch (error) {
      logger.error('Error in getAllProperties', error)
      return []
    }
  }

  static async getUserProperties(userId: string): Promise<Property[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('properties')
        .select(`
          *,
          property_documents (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Error fetching user properties', { userId, error })
        throw error
      }

      return this.mapPropertiesToDomain(data || [])
    } catch (error) {
      logger.error('Error in getUserProperties', { userId, error })
      return []
    }
  }

  static async getUserStats(userId: string): Promise<UserStats> {
    try {
      const properties = await this.getUserProperties(userId)
      const documents = await this.getAllUserDocuments(userId)
      
      const verifiedProperties = properties.filter(prop => prop.status === 'verified').length
      const pendingProperties = properties.filter(prop => prop.status === 'pending').length
      const pendingDocuments = documents.filter(doc => doc.status === 'pending').length
      const totalValue = properties.reduce((sum, prop) => sum + prop.value, 0)
      
      return {
        totalProperties: properties.length,
        verifiedProperties,
        pendingProperties,
        pendingDocuments,
        totalValue,
        currency: 'KES'
      }
    } catch (error) {
      logger.error('Error in getUserStats', { userId, error })
      return {
        totalProperties: 0,
        verifiedProperties: 0,
        pendingProperties: 0,
        pendingDocuments: 0,
        totalValue: 0,
        currency: 'KES'
      }
    }
  }

  static async addProperty(userId: string, propertyData: Omit<Property, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Property | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('properties')
        .insert({
          user_id: userId,
          title: propertyData.title,
          type: propertyData.type,
          location: propertyData.location,
          county: propertyData.location, // Default county to location for now
          size: propertyData.size,
          status: propertyData.status || 'pending',
          value: propertyData.value,
          currency: propertyData.currency || 'KES',
          coordinates_lat: propertyData.coordinates?.lat,
          coordinates_lng: propertyData.coordinates?.lng,
        })
        .select()
        .single()

      if (error) {
        logger.error('Error adding property', { userId, error })
        throw error
      }

      logger.info('Property added successfully', { userId, propertyId: data.id })

      // Map the database response to domain model
      return this.mapPropertyToDomain(data, [])
    } catch (error) {
      logger.error('Error in addProperty', { userId, error })
      return null
    }
  }

  static async updateProperty(propertyId: string, updates: Partial<Property>): Promise<Property | null> {
    try {
      const updateData: any = {}
      
      if (updates.title) updateData.title = updates.title
      if (updates.type) updateData.type = updates.type
      if (updates.location) updateData.location = updates.location
      if (updates.size) updateData.size = updates.size
      if (updates.status) updateData.status = updates.status
      if (updates.value !== undefined) updateData.value = updates.value
      if (updates.currency) updateData.currency = updates.currency
      if (updates.coordinates) {
        updateData.coordinates_lat = updates.coordinates.lat
        updateData.coordinates_lng = updates.coordinates.lng
      }

      const { data, error } = await supabaseAdmin
        .from('properties')
        .update(updateData)
        .eq('id', propertyId)
        .select(`
          *,
          property_documents (*)
        `)
        .single()

      if (error) {
        logger.error('Error updating property', { propertyId, error })
        throw error
      }

      logger.info('Property updated successfully', { propertyId })

      return this.mapPropertyToDomain(data, data.property_documents || [])
    } catch (error) {
      logger.error('Error in updateProperty', { propertyId, error })
      return null
    }
  }

  static async deleteProperty(propertyId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('properties')
        .delete()
        .eq('id', propertyId)

      if (error) {
        logger.error('Error deleting property', { propertyId, error })
        throw error
      }

      logger.info('Property deleted successfully', { propertyId })
      return true
    } catch (error) {
      logger.error('Error in deleteProperty', { propertyId, error })
      return false
    }
  }

  static async addDocument(document: Omit<PropertyDocument, 'id' | 'uploadedAt'>): Promise<PropertyDocument | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('property_documents')
        .insert({
          property_id: document.propertyId,
          name: document.name,
          type: document.type,
          url: document.url,
          status: document.status || 'pending',
        })
        .select()
        .single()

      if (error) {
        logger.error('Error adding document', error)
        throw error
      }

      logger.info('Document added successfully', { documentId: data.id })

      return {
        id: data.id,
        propertyId: data.property_id,
        name: data.name,
        type: data.type,
        url: data.url,
        status: data.status,
        uploadedAt: data.uploaded_at,
      }
    } catch (error) {
      logger.error('Error in addDocument', error)
      return null
    }
  }

  static async getPropertyDocuments(propertyId: string): Promise<PropertyDocument[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('property_documents')
        .select('*')
        .eq('property_id', propertyId)
        .order('uploaded_at', { ascending: false })

      if (error) {
        logger.error('Error fetching property documents', { propertyId, error })
        throw error
      }

      return (data || []).map(doc => ({
        id: doc.id,
        propertyId: doc.property_id,
        name: doc.name,
        type: doc.type,
        url: doc.url,
        status: doc.status,
        uploadedAt: doc.uploaded_at,
      }))
    } catch (error) {
      logger.error('Error in getPropertyDocuments', { propertyId, error })
      return []
    }
  }

  static async getAllUserDocuments(userId: string): Promise<PropertyDocument[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('property_documents')
        .select(`
          *,
          properties!inner(user_id)
        `)
        .eq('properties.user_id', userId)
        .order('uploaded_at', { ascending: false })

      if (error) {
        logger.error('Error fetching all user documents', { userId, error })
        throw error
      }

      return (data || []).map(doc => ({
        id: doc.id,
        propertyId: doc.property_id,
        name: doc.name,
        type: doc.type,
        url: doc.url,
        status: doc.status,
        uploadedAt: doc.uploaded_at,
      }))
    } catch (error) {
      logger.error('Error in getAllUserDocuments', { userId, error })
      return []
    }
  }

  static async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('property_documents')
        .delete()
        .eq('id', documentId)

      if (error) {
        logger.error('Error deleting document', { documentId, error })
        throw error
      }

      logger.info('Document deleted successfully', { documentId })
      return true
    } catch (error) {
      logger.error('Error in deleteDocument', { documentId, error })
      return false
    }
  }

  // Helper method to map database properties to domain model
  private static mapPropertyToDomain(dbProperty: any, documents: any[]): Property {
    return {
      id: dbProperty.id,
      userId: dbProperty.user_id,
      title: dbProperty.title,
      type: dbProperty.type,
      location: dbProperty.location,
      size: dbProperty.size,
      status: dbProperty.status,
      value: dbProperty.value,
      currency: dbProperty.currency,
      documents: documents.map(doc => ({
        id: doc.id,
        propertyId: doc.property_id,
        name: doc.name,
        type: doc.type,
        url: doc.url,
        status: doc.status,
        uploadedAt: doc.uploaded_at,
      })),
      coordinates: dbProperty.coordinates_lat && dbProperty.coordinates_lng ? {
        lat: dbProperty.coordinates_lat,
        lng: dbProperty.coordinates_lng,
      } : undefined,
      createdAt: dbProperty.created_at,
      updatedAt: dbProperty.updated_at,
    }
  }

  private static mapPropertiesToDomain(dbProperties: any[]): Property[] {
    return dbProperties.map(prop => 
      this.mapPropertyToDomain(prop, prop.property_documents || [])
    )
  }
}
