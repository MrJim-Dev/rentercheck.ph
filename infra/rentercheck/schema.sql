-- RenterCheck application schema for the MrJim AWS PostgreSQL database.
-- The auth schema is created by mrjim-auth's packaged migrations before this
-- file is applied. This schema deliberately has no provider-specific RLS dependency:
-- the Next.js server validates the current MrJim Auth user before mutations.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ BEGIN CREATE TYPE public.admin_action_type AS ENUM (
  'STATUS_CHANGE', 'NOTE_ADDED', 'EVIDENCE_REVIEWED', 'RENTER_LINKED',
  'REPORT_MERGED', 'REPORTER_CONTACTED', 'MERGED', 'UNMERGED',
  'GROUP_DISSOLVED', 'TRANSFERRED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.amendment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.amendment_type AS ENUM ('ADDITIONAL_INFO', 'NEW_EVIDENCE', 'CORRECTION', 'NEW_IDENTIFIER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.evidence_type AS ENUM ('RENTAL_AGREEMENT', 'PROOF_OF_PAYMENT', 'CONVERSATION', 'ITEM_PHOTO', 'RENTER_ID', 'RENTER_PHOTO', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.identifier_type AS ENUM ('PHONE', 'EMAIL', 'FACEBOOK', 'GOVT_ID'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.incident_type AS ENUM (
  'NON_RETURN', 'UNPAID_BALANCE', 'DAMAGE_DISPUTE', 'FAKE_INFO',
  'THREATS_HARASSMENT', 'OTHER', 'SCAM', 'LATE_PAYMENT',
  'CONTRACT_VIOLATION', 'ABUSIVE_BEHAVIOR', 'PROPERTY_DAMAGE', 'NO_SHOW'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.match_confidence AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EXACT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.rental_category AS ENUM (
  'CAMERA_EQUIPMENT', 'CLOTHING_FASHION', 'ELECTRONICS_GADGETS',
  'VEHICLE_CAR', 'VEHICLE_MOTORCYCLE', 'VEHICLE_BICYCLE',
  'REAL_ESTATE_CONDO', 'REAL_ESTATE_HOUSE', 'REAL_ESTATE_ROOM',
  'FURNITURE_APPLIANCES', 'EVENTS_PARTY', 'TOOLS_EQUIPMENT',
  'SPORTS_OUTDOOR', 'JEWELRY_ACCESSORIES', 'BABY_KIDS', 'OTHER'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.report_status AS ENUM ('DRAFT', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISPUTED', 'RESOLVED', 'DELETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.transaction_type AS ENUM ('purchase', 'usage', 'refund', 'bonus', 'expiry', 'admin_adjustment'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  business_name text,
  business_type text CHECK (business_type IN ('SOLE_PROPRIETORSHIP','PARTNERSHIP','CORPORATION','COOPERATIVE','INDIVIDUAL','OTHER')),
  dti_sec_number text,
  business_address text,
  contact_number text,
  verification_status text DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED','PENDING','VERIFIED','REJECTED')),
  verification_submitted_at timestamptz,
  verification_reviewed_at timestamptz,
  verification_notes text,
  rental_categories text[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY,
  email varchar NOT NULL,
  full_name varchar,
  role varchar DEFAULT 'MODERATOR',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_action_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.renters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  fingerprint varchar NOT NULL UNIQUE,
  full_name varchar NOT NULL,
  full_name_normalized varchar,
  date_of_birth date,
  address text,
  city varchar,
  region varchar,
  total_incidents integer DEFAULT 0,
  verified_incidents integer DEFAULT 0,
  last_incident_date timestamptz,
  verification_status varchar DEFAULT 'UNVERIFIED',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_from_report_id uuid,
  search_vector tsvector,
  CONSTRAINT renters_verification_status_check CHECK (verification_status IN ('UNVERIFIED','VERIFIED','FLAGGED','DISPUTED'))
);

CREATE TABLE IF NOT EXISTS public.credit_action_costs (
  action_key text PRIMARY KEY,
  action_name text NOT NULL,
  cost integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  action_type text DEFAULT 'deduction',
  CONSTRAINT credit_action_costs_action_type_check CHECK (action_type IN ('deduction','addition'))
);

CREATE TABLE IF NOT EXISTS public.incident_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id uuid NOT NULL,
  reporter_email varchar,
  renter_id uuid REFERENCES public.renters(id) ON DELETE SET NULL,
  reported_full_name varchar NOT NULL,
  reported_phone varchar,
  reported_email varchar,
  reported_facebook varchar,
  reported_address text,
  reported_city varchar,
  reported_date_of_birth date,
  incident_type public.incident_type NOT NULL,
  incident_date date NOT NULL,
  incident_end_date date,
  amount_involved numeric,
  incident_region varchar,
  incident_city varchar,
  incident_place text,
  summary text NOT NULL,
  status public.report_status DEFAULT 'PENDING',
  status_changed_at timestamptz DEFAULT now(),
  status_changed_by uuid,
  admin_notes text,
  rejection_reason text,
  dispute_reason text,
  credibility_score integer DEFAULT 50,
  match_confidence public.match_confidence,
  matched_at timestamptz,
  matched_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  submitted_ip inet,
  user_agent text,
  confirmed_truthful boolean DEFAULT false,
  confirmed_consequences boolean DEFAULT false,
  search_vector tsvector,
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  rental_category public.rental_category,
  rental_item_description text,
  reported_aliases jsonb DEFAULT '[]'::jsonb,
  reported_phones jsonb DEFAULT '[]'::jsonb,
  reported_emails jsonb DEFAULT '[]'::jsonb,
  reported_facebooks jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT incident_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id),
  CONSTRAINT incident_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.renter_identifiers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  renter_id uuid REFERENCES public.renters(id) ON DELETE SET NULL,
  identifier_type public.identifier_type NOT NULL,
  identifier_value varchar NOT NULL,
  identifier_normalized varchar NOT NULL,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid,
  first_reported_at timestamptz DEFAULT now(),
  last_reported_at timestamptz DEFAULT now(),
  report_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT renter_identifiers_identifier_type_identifier_normalized_key UNIQUE (identifier_type, identifier_normalized)
);

CREATE TABLE IF NOT EXISTS public.report_identifiers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES public.incident_reports(id) ON DELETE CASCADE,
  identifier_id uuid REFERENCES public.renter_identifiers(id) ON DELETE SET NULL,
  identifier_type public.identifier_type NOT NULL,
  identifier_value varchar NOT NULL,
  identifier_normalized varchar NOT NULL,
  is_matched boolean DEFAULT false,
  matched_at timestamptz,
  match_confidence public.match_confidence,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT report_identifiers_report_id_identifier_type_identifier_nor_key UNIQUE (report_id, identifier_type, identifier_normalized)
);

CREATE TABLE IF NOT EXISTS public.report_evidence (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES public.incident_reports(id) ON DELETE CASCADE,
  evidence_type public.evidence_type NOT NULL,
  file_name varchar NOT NULL,
  file_size integer NOT NULL,
  mime_type varchar NOT NULL,
  storage_path text NOT NULL,
  storage_bucket varchar DEFAULT 'evidence',
  public_url text,
  thumbnail_path text,
  uploaded_at timestamptz DEFAULT now(),
  uploaded_by uuid NOT NULL,
  is_reviewed boolean DEFAULT false,
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_notes text,
  contains_pii boolean DEFAULT true,
  is_redacted boolean DEFAULT false,
  display_order integer DEFAULT 0,
  amendment_id uuid
);

CREATE TABLE IF NOT EXISTS public.report_amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.incident_reports(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amendment_type public.amendment_type NOT NULL,
  status public.amendment_status NOT NULL DEFAULT 'PENDING',
  changes_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  reporter_notes text,
  admin_notes text,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  merged_at timestamptz
);

DO $$ BEGIN
  ALTER TABLE public.report_evidence
    ADD CONSTRAINT report_evidence_amendment_id_fkey FOREIGN KEY (amendment_id) REFERENCES public.report_amendments(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.report_edits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES public.incident_reports(id) ON DELETE CASCADE,
  edited_by uuid NOT NULL REFERENCES public.admin_users(id),
  edited_at timestamptz DEFAULT now(),
  changes jsonb NOT NULL,
  change_note text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.report_admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.incident_reports(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES public.admin_users(id),
  action_type public.admin_action_type NOT NULL,
  previous_status public.report_status,
  new_status public.report_status,
  notes text,
  action_details jsonb,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_info_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES public.incident_reports(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.admin_users(id),
  request_message text NOT NULL,
  response_message text,
  responded_at timestamptz,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.incident_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.incident_reports(id) ON DELETE CASCADE,
  disputer_id uuid NOT NULL REFERENCES public.users(id),
  category text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','APPROVED','REJECTED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dispute_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.incident_disputes(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'evidence',
  uploaded_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  currency text DEFAULT 'PHP',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.credit_wallets(id) ON UPDATE CASCADE ON DELETE CASCADE,
  amount integer NOT NULL,
  type public.transaction_type NOT NULL,
  reference_id text,
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.search_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parameter_type text NOT NULL,
  parameter_value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.admin_users(id),
  group_name text,
  primary_report_id uuid REFERENCES public.incident_reports(id) ON DELETE SET NULL,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.report_groups(id) ON DELETE CASCADE,
  report_id uuid NOT NULL UNIQUE REFERENCES public.incident_reports(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid NOT NULL REFERENCES public.admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_wallet_id ON public.credit_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_incident_disputes_report_id ON public.incident_disputes(report_id);
CREATE INDEX IF NOT EXISTS idx_incident_disputes_disputer_id ON public.incident_disputes(disputer_id);
CREATE INDEX IF NOT EXISTS idx_incident_disputes_status ON public.incident_disputes(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.incident_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_incident_date ON public.incident_reports(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_incident_type ON public.incident_reports(incident_type);
CREATE INDEX IF NOT EXISTS idx_reports_renter_id ON public.incident_reports(renter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.incident_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reviewed_at ON public.incident_reports(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_reports_reported_phone ON public.incident_reports(reported_phone) WHERE reported_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_reported_email ON public.incident_reports(lower(reported_email::text)) WHERE reported_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_search_vector ON public.incident_reports USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_identifiers_normalized ON public.renter_identifiers(identifier_normalized);
CREATE INDEX IF NOT EXISTS idx_identifiers_type_value ON public.renter_identifiers(identifier_type, identifier_normalized);
CREATE INDEX IF NOT EXISTS idx_identifiers_renter_id ON public.renter_identifiers(renter_id);
CREATE INDEX IF NOT EXISTS idx_renters_full_name_normalized ON public.renters(full_name_normalized);
CREATE INDEX IF NOT EXISTS idx_renters_search_vector ON public.renters USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_renters_total_incidents ON public.renters(total_incidents DESC);
CREATE INDEX IF NOT EXISTS idx_renters_verification_status ON public.renters(verification_status);
CREATE INDEX IF NOT EXISTS idx_report_evidence_report_id ON public.report_evidence(report_id);
CREATE INDEX IF NOT EXISTS idx_report_evidence_amendment_id ON public.report_evidence(amendment_id);
CREATE INDEX IF NOT EXISTS idx_report_evidence_uploaded_at ON public.report_evidence(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_identifiers_report_id ON public.report_identifiers(report_id);
CREATE INDEX IF NOT EXISTS idx_report_identifiers_identifier_id ON public.report_identifiers(identifier_id);
CREATE INDEX IF NOT EXISTS idx_report_identifiers_normalized ON public.report_identifiers(identifier_normalized);
CREATE INDEX IF NOT EXISTS idx_report_amendments_report_id ON public.report_amendments(report_id);
CREATE INDEX IF NOT EXISTS idx_report_amendments_reporter_id ON public.report_amendments(reporter_id);
CREATE INDEX IF NOT EXISTS idx_report_amendments_status ON public.report_amendments(status);
CREATE INDEX IF NOT EXISTS idx_report_edits_report_id ON public.report_edits(report_id);
CREATE INDEX IF NOT EXISTS idx_report_edits_edited_at ON public.report_edits(edited_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_report_id ON public.report_admin_actions(report_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.report_admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.report_admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_info_requests_report_id ON public.report_info_requests(report_id);
CREATE INDEX IF NOT EXISTS idx_info_requests_pending ON public.report_info_requests(created_at DESC) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS search_access_logs_lookup_idx ON public.search_access_logs(user_id, parameter_type, parameter_value);
CREATE INDEX IF NOT EXISTS idx_report_groups_primary_report ON public.report_groups(primary_report_id);
CREATE INDEX IF NOT EXISTS idx_report_group_members_group_id ON public.report_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_report_group_members_report_id ON public.report_group_members(report_id);

CREATE OR REPLACE FUNCTION public.normalize_identifier(p_type public.identifier_type, p_value varchar)
RETURNS varchar LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
BEGIN
  CASE p_type
    WHEN 'PHONE' THEN RETURN regexp_replace(p_value, '[^0-9]', '', 'g');
    WHEN 'EMAIL' THEN RETURN lower(trim(p_value));
    WHEN 'FACEBOOK' THEN RETURN lower(regexp_replace(regexp_replace(p_value, '^https?://(www\.)?(facebook\.com|fb\.com)/', ''), '[/?].*$', ''));
    ELSE RETURN lower(trim(p_value));
  END CASE;
END; $$;

CREATE OR REPLACE FUNCTION public.generate_renter_fingerprint(p_name varchar, p_identifiers jsonb)
RETURNS varchar LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE v_data text;
BEGIN
  v_data := lower(regexp_replace(p_name, '[^a-zA-Z0-9]', '', 'g'));
  IF p_identifiers IS NOT NULL THEN
    v_data := v_data || coalesce(p_identifiers->>'phone', '') || coalesce(p_identifiers->>'email', '');
  END IF;
  RETURN encode(sha256(v_data::bytea), 'hex');
END; $$;

CREATE OR REPLACE FUNCTION public.update_report_search_vector()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('english', coalesce(NEW.reported_full_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.incident_city, '')), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.update_incident_search_vector()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('english', coalesce(NEW.reported_full_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.incident_city, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.incident_region, '')), 'C') ||
    setweight(to_tsvector('english', coalesce((select string_agg(alias, ' ') from jsonb_array_elements_text(CASE WHEN jsonb_typeof(NEW.reported_aliases) = 'array' THEN NEW.reported_aliases ELSE '[]'::jsonb END) alias), '')), 'A');
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.update_renter_search_vector()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('english', coalesce(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.city, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.region, '')), 'C');
  NEW.full_name_normalized := lower(regexp_replace(NEW.full_name, '[^a-zA-Z0-9 ]', '', 'g'));
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.normalize_identifier_trigger()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.identifier_normalized := public.normalize_identifier(NEW.identifier_type, NEW.identifier_value);
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.update_report_review_timestamps()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'UNDER_REVIEW' AND (OLD.status IS NULL OR OLD.status <> 'UNDER_REVIEW') THEN NEW.reviewed_at := now(); END IF;
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status <> 'APPROVED') THEN NEW.published_at := now(); END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.update_renter_stats()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_old uuid; v_new uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN v_old := OLD.renter_id; END IF;
  IF TG_OP <> 'DELETE' THEN v_new := NEW.renter_id; END IF;
  IF v_old IS NOT NULL AND (TG_OP = 'DELETE' OR v_old IS DISTINCT FROM v_new) THEN
    UPDATE public.renters SET total_incidents = (select count(*) from public.incident_reports where renter_id = v_old), verified_incidents = (select count(*) from public.incident_reports where renter_id = v_old and status = 'APPROVED'), last_incident_date = (select max(incident_date) from public.incident_reports where renter_id = v_old and status = 'APPROVED'), updated_at = now() WHERE id = v_old;
  END IF;
  IF v_new IS NOT NULL THEN
    UPDATE public.renters SET total_incidents = (select count(*) from public.incident_reports where renter_id = v_new), verified_incidents = (select count(*) from public.incident_reports where renter_id = v_new and status = 'APPROVED'), last_incident_date = (select max(incident_date) from public.incident_reports where renter_id = v_new and status = 'APPROVED'), updated_at = now() WHERE id = v_new;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END; $$;

CREATE OR REPLACE FUNCTION public.update_admin_last_action()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN UPDATE public.admin_users SET last_action_at = now() WHERE id = NEW.admin_id; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_report_group_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_wallet_id uuid;
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (NEW.id, coalesce(NEW.email, ''), coalesce(NEW.user_metadata->>'full_name', ''), NEW.user_metadata->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.credit_wallets (user_id, balance) VALUES (NEW.id, 50)
  ON CONFLICT (user_id) DO NOTHING RETURNING id INTO v_wallet_id;
  IF v_wallet_id IS NOT NULL THEN
    INSERT INTO public.credit_transactions (wallet_id, amount, type, description) VALUES (v_wallet_id, 50, 'bonus', 'Welcome Bonus: 50 Free Credits');
  END IF;
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS rentercheck_auth_user_created ON auth.users;
CREATE TRIGGER rentercheck_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
DROP TRIGGER IF EXISTS rentercheck_identifier_normalized ON public.renter_identifiers;
CREATE TRIGGER rentercheck_identifier_normalized BEFORE INSERT OR UPDATE ON public.renter_identifiers FOR EACH ROW EXECUTE FUNCTION public.normalize_identifier_trigger();
DROP TRIGGER IF EXISTS rentercheck_incident_search ON public.incident_reports;
CREATE TRIGGER rentercheck_incident_search BEFORE INSERT OR UPDATE ON public.incident_reports FOR EACH ROW EXECUTE FUNCTION public.update_incident_search_vector();
DROP TRIGGER IF EXISTS rentercheck_renter_search ON public.renters;
CREATE TRIGGER rentercheck_renter_search BEFORE INSERT OR UPDATE ON public.renters FOR EACH ROW EXECUTE FUNCTION public.update_renter_search_vector();
DROP TRIGGER IF EXISTS rentercheck_report_review ON public.incident_reports;
CREATE TRIGGER rentercheck_report_review BEFORE UPDATE ON public.incident_reports FOR EACH ROW EXECUTE FUNCTION public.update_report_review_timestamps();
DROP TRIGGER IF EXISTS rentercheck_renter_stats ON public.incident_reports;
CREATE TRIGGER rentercheck_renter_stats AFTER INSERT OR UPDATE OR DELETE ON public.incident_reports FOR EACH ROW EXECUTE FUNCTION public.update_renter_stats();
DROP TRIGGER IF EXISTS rentercheck_admin_last_action ON public.report_admin_actions;
CREATE TRIGGER rentercheck_admin_last_action AFTER INSERT ON public.report_admin_actions FOR EACH ROW EXECUTE FUNCTION public.update_admin_last_action();
DROP TRIGGER IF EXISTS rentercheck_group_updated_at ON public.report_groups;
CREATE TRIGGER rentercheck_group_updated_at BEFORE UPDATE ON public.report_groups FOR EACH ROW EXECUTE FUNCTION public.update_report_group_updated_at();

CREATE OR REPLACE FUNCTION public.perform_cost_deduction(p_user_id uuid, p_action_key text, p_cost integer, p_ref_id text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_wallet_id uuid; v_current integer; v_new integer; v_name text; v_type text; v_tx public.transaction_type;
BEGIN
  SELECT id, balance INTO v_wallet_id, v_current FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found for user'; END IF;
  SELECT action_name, action_type INTO v_name, v_type FROM public.credit_action_costs WHERE action_key = p_action_key;
  v_name := coalesce(v_name, p_action_key); v_type := coalesce(v_type, 'deduction');
  IF v_type = 'addition' THEN v_new := v_current + p_cost; v_tx := 'bonus';
  ELSE IF v_current < p_cost THEN RAISE EXCEPTION 'Insufficient credits'; END IF; v_new := v_current - p_cost; v_tx := 'usage'; END IF;
  UPDATE public.credit_wallets SET balance = v_new, updated_at = now() WHERE id = v_wallet_id;
  INSERT INTO public.credit_transactions (wallet_id, amount, type, description, reference_id, metadata) VALUES (v_wallet_id, CASE WHEN v_type = 'addition' THEN p_cost ELSE -p_cost END, v_tx, 'Action: ' || v_name, p_ref_id, jsonb_build_object('action_key', p_action_key, 'action_type', v_type));
  RETURN v_new;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_adjust_credits(p_user_id uuid, p_amount integer, p_description text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_wallet_id uuid; v_new integer;
BEGIN
  SELECT id INTO v_wallet_id FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found for user'; END IF;
  UPDATE public.credit_wallets SET balance = balance + p_amount, updated_at = now() WHERE id = v_wallet_id RETURNING balance INTO v_new;
  IF v_new < 0 THEN RAISE EXCEPTION 'Balance cannot fall below zero'; END IF;
  INSERT INTO public.credit_transactions (wallet_id, amount, type, description, metadata) VALUES (v_wallet_id, p_amount, 'admin_adjustment', p_description, jsonb_build_object('admin_adjustment', true));
  RETURN v_new;
END; $$;

CREATE OR REPLACE FUNCTION public.consume_credits_for_user(p_user_id uuid, p_amount integer, p_description text, p_reference_id text DEFAULT NULL, p_type public.transaction_type DEFAULT 'usage')
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_wallet_id uuid; v_current integer; v_new integer;
BEGIN
  SELECT id, balance INTO v_wallet_id, v_current FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found for user'; END IF;
  IF v_current < p_amount THEN RAISE EXCEPTION 'Insufficient credits. Current balance: %, Required: %', v_current, p_amount; END IF;
  v_new := v_current - p_amount;
  INSERT INTO public.credit_transactions (wallet_id, amount, type, description, reference_id) VALUES (v_wallet_id, -p_amount, p_type, p_description, p_reference_id);
  UPDATE public.credit_wallets SET balance = v_new, updated_at = now() WHERE id = v_wallet_id;
  RETURN v_new;
END; $$;

CREATE OR REPLACE FUNCTION public.refill_credits_for_user(p_user_id uuid, p_amount integer, p_description text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_wallet_id uuid; v_new integer;
BEGIN
  UPDATE public.credit_wallets SET balance = balance + p_amount, updated_at = now() WHERE user_id = p_user_id RETURNING id, balance INTO v_wallet_id, v_new;
  IF v_wallet_id IS NULL THEN RAISE EXCEPTION 'Wallet not found for user'; END IF;
  INSERT INTO public.credit_transactions (wallet_id, amount, type, description) VALUES (v_wallet_id, p_amount, 'bonus', p_description);
  RETURN v_new;
END; $$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE id = $1 AND is_active = true); $$;
CREATE OR REPLACE FUNCTION public.get_admin_role(user_id uuid)
RETURNS varchar LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT role FROM public.admin_users WHERE id = $1 AND is_active = true; $$;

CREATE OR REPLACE FUNCTION public.find_renter_matches(p_phone varchar DEFAULT NULL, p_email varchar DEFAULT NULL, p_facebook varchar DEFAULT NULL, p_name varchar DEFAULT NULL)
RETURNS TABLE(renter_id uuid, match_type varchar, confidence public.match_confidence)
LANGUAGE sql SET search_path = public AS $$
  SELECT DISTINCT ON (x.renter_id) x.renter_id, x.match_type, x.confidence
  FROM (
    SELECT ri.renter_id, 'PHONE'::varchar match_type, 'EXACT'::public.match_confidence confidence FROM public.renter_identifiers ri WHERE p_phone IS NOT NULL AND ri.renter_id IS NOT NULL AND ri.identifier_type = 'PHONE' AND ri.identifier_normalized = public.normalize_identifier('PHONE', p_phone)
    UNION ALL SELECT ri.renter_id, 'EMAIL'::varchar, 'HIGH'::public.match_confidence FROM public.renter_identifiers ri WHERE p_email IS NOT NULL AND ri.renter_id IS NOT NULL AND ri.identifier_type = 'EMAIL' AND ri.identifier_normalized = public.normalize_identifier('EMAIL', p_email)
    UNION ALL SELECT ri.renter_id, 'FACEBOOK'::varchar, 'MEDIUM'::public.match_confidence FROM public.renter_identifiers ri WHERE p_facebook IS NOT NULL AND ri.renter_id IS NOT NULL AND ri.identifier_type = 'FACEBOOK' AND ri.identifier_normalized = public.normalize_identifier('FACEBOOK', p_facebook)
    UNION ALL SELECT r.id, 'NAME'::varchar, 'LOW'::public.match_confidence FROM public.renters r WHERE p_name IS NOT NULL AND r.full_name_normalized = lower(regexp_replace(p_name, '[^a-zA-Z0-9 ]', '', 'g'))
  ) x ORDER BY x.renter_id, CASE x.confidence WHEN 'EXACT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END;
$$;

DROP VIEW IF EXISTS public.admin_pending_reports CASCADE;
DROP VIEW IF EXISTS public.admin_pending_amendments CASCADE;
DROP VIEW IF EXISTS public.admin_stats CASCADE;
DROP VIEW IF EXISTS public.public_incident_summaries CASCADE;
DROP VIEW IF EXISTS public.public_renter_profiles CASCADE;
DROP VIEW IF EXISTS public.my_reports CASCADE;

CREATE VIEW public.admin_pending_reports AS
SELECT ir.*, (SELECT count(*) FROM public.report_evidence e WHERE e.report_id = ir.id) AS evidence_count,
  (SELECT count(*) FROM public.report_identifiers i WHERE i.report_id = ir.id) AS identifier_count,
  (SELECT count(*) FROM public.renters r JOIN public.renter_identifiers ri ON ri.renter_id = r.id WHERE ri.identifier_normalized IN (SELECT identifier_normalized FROM public.report_identifiers WHERE report_id = ir.id)) AS potential_matches
FROM public.incident_reports ir;
CREATE VIEW public.admin_pending_amendments AS
SELECT ra.*, ir.reported_full_name AS renter_name, ir.incident_type, ir.status AS report_status,
  (SELECT count(*) FROM public.report_evidence e WHERE e.amendment_id = ra.id) AS evidence_count
FROM public.report_amendments ra JOIN public.incident_reports ir ON ir.id = ra.report_id ORDER BY ra.created_at DESC;
CREATE VIEW public.admin_stats AS
SELECT (SELECT count(*) FROM public.incident_reports WHERE status='PENDING') pending_count,
  (SELECT count(*) FROM public.incident_reports WHERE status='UNDER_REVIEW') under_review_count,
  (SELECT count(*) FROM public.incident_reports WHERE status='APPROVED') approved_count,
  (SELECT count(*) FROM public.incident_reports WHERE status='REJECTED') rejected_count,
  (SELECT count(*) FROM public.incident_reports WHERE created_at > now()-interval '24 hours') reports_last_24h,
  (SELECT count(*) FROM public.incident_reports WHERE created_at > now()-interval '7 days') reports_last_7d,
  (SELECT count(DISTINCT reporter_id) FROM public.incident_reports) unique_reporters,
  (SELECT count(*) FROM public.renters WHERE verification_status='VERIFIED') verified_renters;
CREATE VIEW public.public_incident_summaries AS
SELECT id, renter_id, incident_type, incident_date, incident_region, incident_city,
  CASE WHEN length(summary)>200 THEN substring(summary,1,200)||'...' ELSE summary END summary_truncated,
  amount_involved, status, created_at, (SELECT count(*) FROM public.report_evidence e WHERE e.report_id=ir.id) evidence_count
FROM public.incident_reports ir WHERE status='APPROVED';
CREATE VIEW public.public_renter_profiles AS
SELECT id, fingerprint,
  CASE WHEN length(split_part(full_name,' ',1))>0 THEN substring(split_part(full_name,' ',1),1,1)||repeat('*',greatest(length(split_part(full_name,' ',1))-1,2)) ELSE '' END || ' ' ||
  CASE WHEN length(split_part(full_name,' ',2))>0 THEN substring(split_part(full_name,' ',2),1,1)||repeat('*',greatest(length(split_part(full_name,' ',2))-1,1)) ELSE '' END name_masked,
  city, region, total_incidents, verified_incidents, last_incident_date, verification_status, created_at
FROM public.renters WHERE verification_status IN ('VERIFIED','FLAGGED') AND verified_incidents > 0;
CREATE VIEW public.my_reports AS
SELECT ir.*, r.full_name renter_name, r.fingerprint renter_fingerprint,
  (SELECT count(*) FROM public.report_evidence e WHERE e.report_id=ir.id) evidence_count,
  (SELECT count(*) FROM public.report_info_requests q WHERE q.report_id=ir.id AND q.is_resolved=false) pending_requests
FROM public.incident_reports ir LEFT JOIN public.renters r ON r.id=ir.renter_id;
