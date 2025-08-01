# Supabase Setup Guide

This guide will help you set up Supabase for your Stable Story Hub application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `stable-story-hub` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Select the region closest to your users
5. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - Project URL
   - Anon public key

## 3. Set Up Environment Variables

Create a `.env` file in your project root with the following variables:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace the values with your actual Supabase project credentials.

## 4. Create Storage Bucket

1. In your Supabase dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Enter the following details:
   - **Name**: `horse-media`
   - **Public bucket**: ✅ Check this box (so images/videos can be accessed publicly)
   - **File size limit**: `100 MB`
   - **Allowed MIME types**: Leave empty (we'll handle validation in the app)
4. Click **Create bucket**

## 5. Create Database Tables

Run the following SQL in your Supabase SQL Editor:

**Note:** If you already have existing tables and want to add the new pedigree columns without recreating them, use the ALTER statements at the bottom of this file instead.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create horses table
CREATE TABLE horses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  breed VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  color VARCHAR(255) NOT NULL,
  gender VARCHAR(50) NOT NULL CHECK (gender IN ('Stallion', 'Mare', 'Gelding')),
  height VARCHAR(50) NOT NULL,
  weight INTEGER,
  price DECIMAL(10,2),
  status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Sold', 'Reserved', 'Not for Sale')),
  description TEXT NOT NULL,
  pedigree_sire VARCHAR(255),
  pedigree_dam VARCHAR(255),
  pedigree_sire_sire VARCHAR(255),
  pedigree_sire_dam VARCHAR(255),
  pedigree_dam_sire VARCHAR(255),
  pedigree_dam_dam VARCHAR(255),
  pedigree_sire_sire_sire VARCHAR(255),
  pedigree_sire_sire_dam VARCHAR(255),
  pedigree_sire_dam_sire VARCHAR(255),
  pedigree_sire_dam_dam VARCHAR(255),
  pedigree_dam_sire_sire VARCHAR(255),
  pedigree_dam_sire_dam VARCHAR(255),
  pedigree_dam_dam_sire VARCHAR(255),
  pedigree_dam_dam_dam VARCHAR(255),
  health_vaccinations BOOLEAN NOT NULL DEFAULT false,
  health_coggins BOOLEAN NOT NULL DEFAULT false,
  health_last_vet_check DATE NOT NULL,
  training_level VARCHAR(100) NOT NULL,
  training_disciplines TEXT[] NOT NULL,
  location VARCHAR(255) NOT NULL,
  date_added DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create horse_images table
CREATE TABLE horse_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption VARCHAR(500),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create horse_videos table
CREATE TABLE horse_videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption VARCHAR(500),
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create competitions table
CREATE TABLE competitions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  event VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  discipline VARCHAR(255) NOT NULL,
  placement VARCHAR(100) NOT NULL,
  notes TEXT,
  equipe_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create share_links table
CREATE TABLE share_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  recipient_name VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_horses_user_id ON horses(user_id);
CREATE INDEX idx_horses_breed ON horses(breed);
CREATE INDEX idx_horses_status ON horses(status);
CREATE INDEX idx_horse_images_horse_id ON horse_images(horse_id);
CREATE INDEX idx_horse_videos_horse_id ON horse_videos(horse_id);
CREATE INDEX idx_competitions_horse_id ON competitions(horse_id);
CREATE INDEX idx_share_links_token ON share_links(token);
CREATE INDEX idx_share_links_horse_id ON share_links(horse_id);
CREATE INDEX idx_share_links_created_by ON share_links(created_by);

-- Enable Row Level Security (RLS)
ALTER TABLE horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE horse_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE horse_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Horses: Users can only see their own horses
CREATE POLICY "Users can view own horses" ON horses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own horses" ON horses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own horses" ON horses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own horses" ON horses
  FOR DELETE USING (auth.uid() = user_id);

-- Horse images: Users can only see images of their own horses
CREATE POLICY "Users can view own horse images" ON horse_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM horses 
      WHERE horses.id = horse_images.horse_id 
      AND horses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own horse images" ON horse_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM horses 
      WHERE horses.id = horse_images.horse_id 
      AND horses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own horse images" ON horse_images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM horses 
      WHERE horses.id = horse_images.horse_id 
      AND horses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own horse images" ON horse_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM horses 
      WHERE horses.id = horse_images.horse_id 
      AND horses.user_id = auth.uid()
    )
  );

-- Horse videos: Users can only see videos of their own horses
CREATE POLICY "Users can view own horse videos" ON horse_videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM horses 
      WHERE horses.id = horse_videos.horse_id 
      AND horses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own horse videos" ON horse_videos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM horses 
      WHERE horses.id = horse_videos.horse_id 
      AND horses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own horse videos" ON horse_videos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM horses 
      WHERE horses.id = horse_videos.horse_id 
      AND horses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own horse videos" ON horse_videos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM horses 
      WHERE horses.id = horse_videos.horse_id 
      AND horses.user_id = auth.uid()
    )
  );

-- Competitions: Users can only see competitions of their own horses
CREATE POLICY "Users can view own horse competitions" ON competitions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM horses 
      WHERE horses.id = competitions.horse_id 
      AND horses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own horse competitions" ON competitions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM horses 
      WHERE horses.id = competitions.horse_id 
      AND horses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own horse competitions" ON competitions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM horses 
      WHERE horses.id = competitions.horse_id 
      AND horses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own horse competitions" ON competitions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM horses 
      WHERE horses.id = competitions.horse_id 
      AND horses.user_id = auth.uid()
    )
  );

-- Share links: Users can only manage their own share links
CREATE POLICY "Users can view own share links" ON share_links
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own share links" ON share_links
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own share links" ON share_links
  FOR DELETE USING (auth.uid() = created_by);

-- Storage policies for horse-media bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'horse-media' AND 
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated users to view files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'horse-media' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to update their own files
CREATE POLICY "Allow users to update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'horse-media' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'horse-media' AND 
    auth.role() = 'authenticated'
  );

## 6. Update Existing Tables (Alternative to Full Setup)

If you already have existing tables and want to add the new pedigree columns without recreating them, run these ALTER statements instead:

```sql
-- Add new pedigree columns for 4-generation pedigree
ALTER TABLE horses 
ADD COLUMN IF NOT EXISTS pedigree_sire_sire VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_sire_dam VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_dam_sire VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_dam_dam VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_sire_sire_sire VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_sire_sire_dam VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_sire_dam_sire VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_sire_dam_dam VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_dam_sire_sire VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_dam_sire_dam VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_dam_dam_sire VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_dam_dam_dam VARCHAR(255);

-- Add equipe_link column to competitions table (if not already added)
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS equipe_link TEXT;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'horses' 
AND column_name LIKE 'pedigree%'
ORDER BY column_name;
```

## 7. Configure Authentication

1. In your Supabase dashboard, go to Authentication → Settings
2. Configure your site URL (e.g., `http://localhost:5173` for development)
3. Add redirect URLs for your application
4. Configure email templates if desired

## 7. Test Your Setup

1. Start your development server: `npm run dev`
2. Navigate to your application
3. Try to sign up/sign in
4. Create a new horse to test the database connection
5. Try uploading images/videos to test the storage functionality

## Troubleshooting

- **Environment variables not loading**: Make sure your `.env` file is in the project root and starts with `VITE_`
- **Authentication errors**: Check that your Supabase URL and anon key are correct
- **Database errors**: Ensure you've run the SQL script and RLS policies are in place
- **CORS errors**: Add your localhost URL to the allowed origins in Supabase settings

## Security Notes

- Never commit your `.env` file to version control
- The anon key is safe to use in the frontend as it has limited permissions
- Row Level Security (RLS) ensures users can only access their own data
- All database operations are protected by RLS policies 