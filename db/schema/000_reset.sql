-- =====================================================================
-- 000 · Reset
-- Drops everything in the public schema. Dev only — run via `npm run db:reset`.
-- =====================================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- btree_gist lets EXCLUDE constraints mix "=" (int) with "&&" (daterange).
-- Used by room_rate's no-overlap rule in 080_business_rules.sql.
CREATE EXTENSION IF NOT EXISTS btree_gist;
