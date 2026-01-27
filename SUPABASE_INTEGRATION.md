# ArdhiX Supabase Integration

This document explains the production-ready Supabase integration for the ArdhiX Land Registry system.

## Overview

The system uses Supabase for:
- **Authentication** (sign up, sign in, password reset, session management)
- **User profiles** and data storage
- **Property management** with full CRUD operations
- **Document storage** and tracking
- **Admin user management**
- **Database persistence** (no more data loss on restart)

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

**Note:** Never commit `.env.local` to version control. Use `.env.example` as a template.

### 2. Database Setup

Execute the SQL scripts in your Supabase project in this order:

1. **Schema Setup**: Run `supabase-setup.sql` first
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase-setup.sql`
   - Execute the script

2. **Demo Data** (Optional): Run `database-seed.sql` for demo data
   - Execute after creating your first users via sign-up
   - Update the UUIDs in the script to match your created user IDs
   - Or skip and create data through the UI

This creates all necessary tables and sets up Row Level Security (RLS) policies.

### 3. Authentication Configuration

In your Supabase dashboard, go to Authentication > Settings:
- Configure email provider for password resets
- Set site URL to your deployment URL
- Enable email confirmations (optional for development)
- Configure password requirements (optional - we validate on the server)

## File Structure

### Core Files

- `lib/supabase.ts` - Supabase client configuration and database types
- `lib/supabase-auth.ts` - Authentication service using Supabase Auth
- `lib/property-service.ts` - Database-backed property management
- `lib/admin-user-service.ts` - Database-backed user management
- `lib/logger.ts` - Production logging service
- `lib/rate-limiter.ts` - API rate limiting
- `lib/csrf.ts` - CSRF protection utilities
- `supabase-setup.sql` - Database schema and setup script
- `database-seed.sql` - Demo data for development

### Updated API Routes

All authentication routes use Supabase with enhanced security:

- `app/api/auth/login/route.ts` - Rate-limited login with session cookies
- `app/api/auth/register/route.ts` - Strong password validation + profile creation
- `app/api/auth/logout/route.ts` - Session cleanup
- `app/api/auth/me/route.ts` - Session validation from HTTP-only cookie
- `app/api/auth/forgot-password/route.ts` - Supabase password reset email
- `app/api/auth/reset-password/route.ts` - Password update with strong validation

### Security Enhancements

- **Middleware** (`middleware.ts`) - Server-side route protection
- **HTTP-only cookies** - No localStorage for auth tokens
- **Rate limiting** - 5 attempts per 5 minutes on auth endpoints
- **Account lockout** - 15 minutes after 5 failed attempts
- **Strong passwords** - Min 8 chars with complexity requirements
- **Logging** - All auth events logged (development mode)

## Database Schema

### Tables Created

1. **profiles** - User profile information (extends auth.users)
   - Linked to Supabase Auth users via UUID
   - Stores role, verification status, and profile data

2. **properties** - Property records
   - User ownership via user_id foreign key
   - Status tracking (verified, pending, rejected)
   - Coordinates for map display

3. **property_documents** - Document attachments for properties
   - Document type categorization
   - Status workflow (pending, approved, rejected)

4. **property_transfers** - Property ownership transfers
   - Transfer status tracking
   - Audit trail for ownership changes

5. **property_history** - Audit log for property changes
   - Complete action history
   - User attribution for changes

### Row Level Security

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Admins can access all data where appropriate
- Proper access controls for shared data (transfers, etc.)
- Profile creation only via authenticated requests

## Testing

Visit `/test` to verify the Supabase integration:
- Checks Supabase connection
- Verifies authentication setup
- Shows configuration status

## Migration Notes

### What Changed

1. **Authentication**: Moved from JWT with in-memory storage to Supabase Auth
2. **User Storage**: User profiles now stored in Supabase `profiles` table
3. **Session Management**: Uses Supabase session tokens instead of custom JWT
4. **Password Reset**: Now uses Supabase email-based password reset

### Backward Compatibility

The API endpoints remain the same, ensuring frontend components continue to work without modification.

### Security Improvements

- Row Level Security enforces data access rules at the database level
- Supabase handles secure password hashing and session management
- Proper separation of anon and service role permissions

## Next Steps

1. **Execute the SQL setup script** in your Supabase project
2. **Test the authentication flow** by visiting `/test`
3. **Create test user accounts** to verify functionality
4. **Configure email templates** in Supabase for password reset (optional)

## Troubleshooting

### Common Issues

1. **Connection errors**: Verify environment variables are set correctly
2. **Permission errors**: Ensure RLS policies are created properly
3. **Build errors**: The system may have unrelated build issues that don't affect Supabase integration

### Support

Check the Supabase documentation for additional configuration options:
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/database