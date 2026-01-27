# Production Readiness Guide

This document outlines the production-ready features and security measures implemented in the ArdhiX Land Registry System.

## Overview

The system has been hardened for production deployment with:
- ✅ Supabase database integration (no data loss on restart)
- ✅ HTTP-only cookie authentication (no localStorage tokens)
- ✅ Strong password requirements (8+ chars with complexity)
- ✅ Rate limiting on authentication endpoints
- ✅ Account lockout after failed attempts
- ✅ Production logging service
- ✅ Server-side session validation
- ✅ CSRF protection utilities
- ✅ Comprehensive input validation

## Security Features

### 1. Authentication Security

#### Strong Password Requirements
All passwords must meet these criteria:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

Example valid password: `MyP@ssw0rd`

#### Rate Limiting
- **Login attempts**: 5 attempts per 5-minute window
- **Registration**: 3 attempts per IP per 5-minute window
- **Lockout duration**: 15 minutes after exceeding limit

#### Session Management
- Tokens stored in **HTTP-only cookies** (not accessible to JavaScript)
- Secure flag enabled in production
- SameSite=strict to prevent CSRF
- Server-side session validation on every request
- Middleware protection on all routes

### 2. Database Security

#### Supabase Integration
- PostgreSQL database with full ACID compliance
- Row Level Security (RLS) policies on all tables
- User isolation (users can only see their own data)
- Admin override for administrative functions

#### Data Persistence
- All user data persists across server restarts
- Properties and documents stored in database
- No in-memory data that can be lost

### 3. API Security

#### Input Validation
- Server-side validation for all inputs
- Zod schemas for type safety
- Email format validation
- Phone number format validation (Kenyan format)
- National ID format validation

#### Logging
- Production-ready logging service (`lib/logger.ts`)
- All authentication events logged
- Error tracking without exposing sensitive data
- Configurable log levels (info, warn, error, debug)

#### CSRF Protection
- CSRF token utilities available (`lib/csrf.ts`)
- SameSite cookie configuration
- Token validation helpers ready for form integration

## Environment Setup

### Required Environment Variables

Create a `.env.local` file (see `.env.example`):

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Application URLs (REQUIRED)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Environment
NODE_ENV=production
```

### Database Setup

1. Run the schema setup:
   ```sql
   -- Execute contents of supabase-setup.sql in Supabase SQL Editor
   ```

2. (Optional) Load demo data:
   ```sql
   -- Execute contents of database-seed.sql
   -- Note: Update UUIDs to match your created users
   ```

## Deployment Checklist

### Pre-Deployment

- [ ] Set all environment variables in production
- [ ] Configure Supabase project for production
- [ ] Run database migrations (supabase-setup.sql)
- [ ] Set NODE_ENV=production
- [ ] Enable email confirmations in Supabase Auth (optional)
- [ ] Configure password reset email templates

### Security Configuration

- [ ] Verify HTTP-only cookies are enabled
- [ ] Ensure secure flag is set (HTTPS only)
- [ ] Configure CORS if needed
- [ ] Set up rate limiting monitoring
- [ ] Review RLS policies in Supabase

### Testing Requirements

- [ ] Test user registration with strong passwords
- [ ] Test login with rate limiting
- [ ] Verify account lockout works
- [ ] Test password reset flow
- [ ] Verify data persists after server restart
- [ ] Test admin panel with database data
- [ ] Verify middleware authentication works
- [ ] Test all CRUD operations on properties

## Code Quality Standards

### No Console.log in Production
All `console.log` statements have been replaced with the production logger:

```typescript
import { logger } from '@/lib/logger'

// Instead of: console.log('User logged in')
logger.info('User logged in', { userId: user.id })

// Instead of: console.error('Error:', error)
logger.error('Login failed', error)
```

### TypeScript Type Safety
- All types properly defined in `types/auth.ts`
- No `any` types in production code
- Proper error handling with typed responses

### Validation Standards
- Client-side validation for UX
- Server-side validation as source of truth
- Zod schemas for consistency
- Proper error messages for users

## API Rate Limits

### Authentication Endpoints

| Endpoint | Max Attempts | Time Window | Lockout Duration |
|----------|--------------|-------------|------------------|
| `/api/auth/login` | 5 | 5 minutes | 15 minutes |
| `/api/auth/register` | 3 | 5 minutes | 15 minutes |
| Other endpoints | No limit | N/A | N/A |

### Handling Rate Limits

When rate limit is exceeded, API returns:
```json
{
  "success": false,
  "error": "Too many attempts. Account locked for X minutes."
}
```

HTTP Status Code: `429 Too Many Requests`

## Monitoring and Logging

### Log Levels

- **info**: Normal operations (login, logout, data changes)
- **warn**: Potential issues (rate limits, failed attempts)
- **error**: Actual errors (database errors, auth failures)
- **debug**: Development debugging (only in NODE_ENV=development)

### In Development
Logs output to console with timestamps and context

### In Production
Configure to send logs to your logging service:
- CloudWatch
- Sentry
- LogRocket
- Custom logging endpoint

Edit `lib/logger.ts` to integrate with your service.

## Breaking Changes from Previous Version

### For Users
- Must log in again (localStorage tokens removed)
- Stronger password required for new accounts
- Password reset requires strong password

### For Developers
- No more localStorage for auth
- All services now async (use Supabase)
- Middleware now validates sessions
- PropertyService and AdminUserService are async

## Migration Guide

### From In-Memory to Database

If you have existing in-memory data:

1. Create users via sign-up flow
2. Note the user IDs from Supabase Auth
3. Update `database-seed.sql` with correct UUIDs
4. Run the seed script

### From Mock Auth to Real Auth

All mock auth has been removed:
- No more hardcoded credentials
- Users must register through the UI
- First user can be made admin in Supabase dashboard

## Support and Troubleshooting

### Common Issues

**Issue: "Too many login attempts"**
- Solution: Wait 15 minutes or contact admin to unlock

**Issue: "Password doesn't meet requirements"**
- Solution: Use 8+ chars with uppercase, lowercase, number, special char

**Issue: "Invalid session"**
- Solution: Log out and log in again

**Issue: "Data not persisting"**
- Solution: Check Supabase connection and RLS policies

### Debug Mode

Enable debug logging:
```env
NODE_ENV=development
```

This will log all authentication events to the console.

## Security Best Practices

1. **Never log sensitive data** (passwords, tokens, etc.)
2. **Always validate on server-side** (client validation is for UX only)
3. **Use parameterized queries** (Supabase handles this)
4. **Keep dependencies updated** (run `npm audit` regularly)
5. **Review RLS policies** (ensure proper data isolation)
6. **Monitor rate limits** (check for abuse patterns)
7. **Rotate secrets regularly** (Supabase service key, JWT secret)

## Performance Considerations

- Database queries are optimized with indexes
- Proper pagination for large datasets
- Connection pooling via Supabase
- Middleware runs on Edge Runtime (fast validation)

## Next Steps

For future enhancements:
- [ ] Add 2FA (Two-Factor Authentication)
- [ ] Implement CSRF tokens in forms
- [ ] Add email verification requirement
- [ ] Implement session management UI
- [ ] Add security headers (CSP, HSTS, etc.)
- [ ] Set up automated backups
- [ ] Configure monitoring and alerting
- [ ] Add audit log viewer for admins

## Additional Documentation

- [Authentication README](./AUTHENTICATION_README.md) - Auth system details
- [Supabase Integration](./SUPABASE_INTEGRATION.md) - Database setup
- [Database Setup](./DATABASE_SETUP.md) - Schema information
- [API Documentation](./API_DOCS.md) - API reference (if exists)
