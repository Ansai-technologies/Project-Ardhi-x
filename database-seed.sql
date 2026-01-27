-- ArdhiX Database Seed Data
-- This script populates the database with demo users and properties
-- Run this after executing supabase-setup.sql

-- Note: User IDs must match auth.users table entries
-- In production, users should sign up through the registration flow
-- This seed data is for development/demo purposes only

-- Insert demo users (profiles only - actual auth users must be created via Supabase Auth)
-- These are example UUIDs - replace with actual auth.users IDs after user signup

-- Demo User 1: John Doe (Regular User)
INSERT INTO public.profiles (id, email, name, role, phone, national_id, location, date_joined, is_verified, avatar) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'john.doe@example.com',
  'John Doe',
  'user',
  '+254700000000',
  'KE12345678',
  'Nairobi, Kenya',
  '2023-01-15',
  true,
  '/placeholder-user.jpg'
)
ON CONFLICT (id) DO NOTHING;

-- Demo User 2: Jane Smith (Admin)
INSERT INTO public.profiles (id, email, name, role, phone, national_id, location, date_joined, is_verified, avatar) VALUES
(
  '00000000-0000-0000-0000-000000000002',
  'jane.smith@example.com',
  'Jane Smith',
  'admin',
  '+254700000001',
  'KE87654321',
  'Mombasa, Kenya',
  '2022-11-20',
  true,
  '/placeholder-user.jpg'
)
ON CONFLICT (id) DO NOTHING;

-- Demo User 3: David Wilson (Unverified User)
INSERT INTO public.profiles (id, email, name, role, phone, national_id, location, date_joined, is_verified, avatar) VALUES
(
  '00000000-0000-0000-0000-000000000003',
  'david.wilson@example.com',
  'David Wilson',
  'user',
  '+254700000002',
  'KE11223344',
  'Kisumu, Kenya',
  '2023-03-10',
  false,
  '/placeholder-user.jpg'
)
ON CONFLICT (id) DO NOTHING;

-- Demo Properties for John Doe
INSERT INTO public.properties (id, user_id, title, type, location, county, size, status, value, currency, coordinates_lat, coordinates_lng) VALUES
(
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Residential Plot - Westlands',
  'residential',
  'Westlands, Nairobi',
  'Nairobi',
  '2.5 Acres',
  'verified',
  25000000,
  'KES',
  -1.2668,
  36.8060
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.properties (id, user_id, title, type, location, county, size, status, value, currency, coordinates_lat, coordinates_lng) VALUES
(
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Commercial Land - CBD',
  'commercial',
  'Central Business District, Nairobi',
  'Nairobi',
  '0.5 Acres',
  'pending',
  45000000,
  'KES',
  -1.2864,
  36.8172
)
ON CONFLICT (id) DO NOTHING;

-- Demo Properties for Jane Smith
INSERT INTO public.properties (id, user_id, title, type, location, county, size, status, value, currency, coordinates_lat, coordinates_lng) VALUES
(
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  'Agricultural Land - Nakuru',
  'agricultural',
  'Nakuru County',
  'Nakuru',
  '50 Acres',
  'verified',
  80000000,
  'KES',
  -0.3031,
  36.0800
)
ON CONFLICT (id) DO NOTHING;

-- Demo Documents for Properties
INSERT INTO public.property_documents (id, property_id, name, type, url, status) VALUES
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Title Deed',
  'title_deed',
  '/documents/title_deed_001.pdf',
  'approved'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.property_documents (id, property_id, name, type, url, status) VALUES
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'Survey Map',
  'survey_map',
  '/documents/survey_map_001.pdf',
  'approved'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.property_documents (id, property_id, name, type, url, status) VALUES
(
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000002',
  'Valuation Report',
  'valuation',
  '/documents/valuation_002.pdf',
  'pending'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.property_documents (id, property_id, name, type, url, status) VALUES
(
  '20000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000003',
  'Title Deed',
  'title_deed',
  '/documents/title_deed_003.pdf',
  'approved'
)
ON CONFLICT (id) DO NOTHING;

-- Create some property history entries
INSERT INTO public.property_history (property_id, action, details, performed_by) VALUES
(
  '10000000-0000-0000-0000-000000000001',
  'Property Registered',
  'Initial property registration with title deed',
  '00000000-0000-0000-0000-000000000001'
);

INSERT INTO public.property_history (property_id, action, details, performed_by) VALUES
(
  '10000000-0000-0000-0000-000000000001',
  'Document Verified',
  'Title deed approved by land registry',
  '00000000-0000-0000-0000-000000000002'
);

INSERT INTO public.property_history (property_id, action, details, performed_by) VALUES
(
  '10000000-0000-0000-0000-000000000002',
  'Property Registered',
  'Commercial property registration pending verification',
  '00000000-0000-0000-0000-000000000001'
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database seeded successfully with demo data!';
  RAISE NOTICE 'Demo users: john.doe@example.com, jane.smith@example.com, david.wilson@example.com';
  RAISE NOTICE 'Note: You must create corresponding auth.users entries via Supabase Auth signup';
  RAISE NOTICE 'Use strong passwords: Min 8 chars, uppercase, lowercase, number, special char';
END $$;
