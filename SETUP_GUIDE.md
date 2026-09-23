# Property Registration System - Setup Guide

## Overview
This is a comprehensive property registration system built with Next.js, featuring:
- Multi-step property registration forms
- Interactive Google Maps integration
- Kenyan counties and wards cascade selection
- Document upload functionality
- Real user authentication and data
- Persistent form data with localStorage

## Setup Instructions

### 1. Install Dependencies
```bash
cd Project-Ardhi-x
npm install
# or
pnpm install
```

### 2. Configure Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/)
2. Create a new project or select existing
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create an API key with the above APIs enabled
5. Copy `.env.example` to `.env.local`
6. Add your API key to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### 3. Database Setup
The app is DB-first on Supabase (PostgreSQL). Run the schema in
`supabase-setup.sql` in your Supabase project's SQL editor; the client
lives in `lib/supabase.ts`. Copy `.env.example` to `.env.local` and fill
in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` from the Supabase dashboard.

### 4. Run the Application
```bash
npm run dev
# or
pnpm dev
```

## Key Features

### Property Registration Form
- **Location**: `/properties/add`
- **Tabs**: Property Details, Location & Map, Documents, Review
- **Persistence**: Form data saved in localStorage on each step
- **Validation**: Real-time validation with error handling

### Interactive Map Component
- **File**: `components/property-location-map.tsx`
- **Features**:
  - Click to set property location
  - Drag marker to fine-tune position
  - Address search with autocomplete
  - Current location detection
  - County-based map centering

### Kenya Location Data
- **File**: `lib/kenya-locations.ts`
- **Data**: All 47 counties with major wards
- **Features**: Cascading county → ward selection

### Form Flow
1. **Property Details**: Basic property information
2. **Location & Map**: 
   - Select county (auto-populates wards)
   - Select ward
   - Use interactive map to pinpoint exact location
   - Address search functionality
3. **Documents**: Upload property documents
4. **Review**: Final review and submission

## Testing the System

### Complete Workflow Test
1. Navigate to: `http://localhost:3000/properties/add`
2. **Tab 1 - Property Details**:
   - Fill in property name, type, description
   - Click "Save and Continue"
   - Verify data persists when switching tabs
3. **Tab 2 - Location & Map**:
   - Select a county (e.g., "Nairobi")
   - Watch wards populate automatically
   - Use the interactive map:
     - Click anywhere to set location
     - Drag the red marker to adjust
     - Use search box for specific addresses
     - Try "Use Current Location" button
4. **Tab 3 - Documents**:
   - Upload sample documents
   - Verify file handling
5. **Tab 4 - Review**:
   - Review all entered data
   - Test "Save as Draft" and "Submit" buttons

### Authentication Test
1. Go to: `http://localhost:3000/dashboard`
2. Verify real user name appears (not "John Doe")
3. Check all placeholder data has been replaced

## File Structure

### Core Components
- `components/property-location-map.tsx` - Interactive Google Maps component
- `app/properties/add/page.tsx` - Multi-step property registration form
- `components/dashboard-layout.tsx` - Main dashboard layout with real user data

### Data and Configuration
- `lib/kenya-locations.ts` - Complete Kenya counties and wards data
- `lib/supabase.ts` - Supabase client (auth, DB, storage)
- `supabase-setup.sql` - Database schema (run in the Supabase SQL editor)
- `lib/google-maps-config.ts` - Google Maps API configuration
- `.env.local.example` - Environment variables template

### Styling and UI
- All components use shadcn/ui components
- Tailwind CSS for styling
- Responsive design for mobile and desktop

## Troubleshooting

### Google Maps Not Loading
1. Check API key in `.env.local`
2. Verify API key has correct permissions
3. Check browser console for errors
4. Ensure APIs are enabled in Google Cloud Console

### Form Data Not Persisting
1. Check browser localStorage in DevTools
2. Verify `localStorage.setItem` calls in form components
3. Check for JavaScript errors preventing save operations

### County/Ward Cascade Not Working
1. Verify `lib/kenya-locations.ts` is imported correctly
2. Check console for data loading errors
3. Ensure county selection triggers ward population

## Production Deployment

### Database
- Supabase is the database — there is no SQLite/PostgreSQL switch
- Run `supabase-setup.sql` in the Supabase SQL editor
- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
  `SUPABASE_SERVICE_ROLE_KEY` in environment variables

### Environment Variables
- Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Configure `DATABASE_URL`
- Set `NEXTAUTH_SECRET` for authentication

### Security
- Restrict Google Maps API key to your domain
- Enable API key restrictions in Google Cloud Console
- Set up proper CORS policies

## Next Steps

1. **Real Database Integration**: Connect to actual database using the provided schema
2. **File Upload Storage**: Implement cloud storage for document uploads
3. **Email Notifications**: Add email confirmations for property submissions
4. **Admin Dashboard**: Create admin interface for property management
5. **Search and Filtering**: Add property search with map-based filtering

## Support

For issues or questions:
1. Check browser console for JavaScript errors
2. Verify all environment variables are set
3. Test with sample data first
4. Check Google Cloud Console for API usage and errors
