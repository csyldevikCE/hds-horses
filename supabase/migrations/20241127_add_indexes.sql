-- Migration: Add database indexes for performance optimization
-- Date: 2024-11-27
-- Description: Adds indexes to frequently queried columns to improve query performance
--              and reduce timeout issues during organization data fetching

-- ============================================================================
-- ORGANIZATION & AUTH INDEXES (Critical for login/auth performance)
-- ============================================================================

-- Index for organization_users lookups by user_id (used in AuthContext)
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id
ON organization_users(user_id);

-- Index for organization_users lookups by organization_id
CREATE INDEX IF NOT EXISTS idx_organization_users_org_id
ON organization_users(organization_id);

-- ============================================================================
-- HORSE INDEXES (Core functionality)
-- ============================================================================

-- Index for horses by organization_id (used in horse listing)
CREATE INDEX IF NOT EXISTS idx_horses_organization_id
ON horses(organization_id);

-- Index for horses by user_id
CREATE INDEX IF NOT EXISTS idx_horses_user_id
ON horses(user_id);

-- Composite index for common horse queries (listing with sorting)
CREATE INDEX IF NOT EXISTS idx_horses_org_updated
ON horses(organization_id, updated_at DESC);

-- ============================================================================
-- SHARING & INVITATIONS INDEXES
-- ============================================================================

-- Index for share_links by token (used for shared horse lookups)
CREATE INDEX IF NOT EXISTS idx_share_links_token
ON share_links(token);

-- Index for share_links by horse_id
CREATE INDEX IF NOT EXISTS idx_share_links_horse_id
ON share_links(horse_id);

-- Index for invitations by token
CREATE INDEX IF NOT EXISTS idx_invitations_token
ON invitations(token);

-- ============================================================================
-- HORSE RELATED DATA INDEXES
-- ============================================================================

-- Index for horse_images by horse_id
CREATE INDEX IF NOT EXISTS idx_horse_images_horse_id
ON horse_images(horse_id);

-- Index for horse_videos by horse_id
CREATE INDEX IF NOT EXISTS idx_horse_videos_horse_id
ON horse_videos(horse_id);

-- Index for competitions by horse_id
CREATE INDEX IF NOT EXISTS idx_competitions_horse_id
ON competitions(horse_id);

-- ============================================================================
-- HEALTH & VETERINARY INDEXES
-- ============================================================================

-- Index for vaccinations by horse_id
CREATE INDEX IF NOT EXISTS idx_vaccinations_horse_id
ON vaccinations(horse_id);

-- Index for vet_visits by horse_id
CREATE INDEX IF NOT EXISTS idx_vet_visits_horse_id
ON vet_visits(horse_id);

-- Index for horse_xrays by horse_id
CREATE INDEX IF NOT EXISTS idx_horse_xrays_horse_id
ON horse_xrays(horse_id);

-- Index for veterinary_documents by horse_id
CREATE INDEX IF NOT EXISTS idx_veterinary_documents_horse_id
ON veterinary_documents(horse_id);

-- Index for vet_visit_documents by vet_visit_id
CREATE INDEX IF NOT EXISTS idx_vet_visit_documents_vet_visit_id
ON vet_visit_documents(vet_visit_id);

-- ============================================================================
-- ANALYTICS INDEXES
-- ============================================================================

-- Index for share_link_views by share_link_id
CREATE INDEX IF NOT EXISTS idx_share_link_views_share_link_id
ON share_link_views(share_link_id);
