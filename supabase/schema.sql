-- ============================================================================
-- TRADYX PRODUCTION POSTGRESQL SCHEMA & ROW LEVEL SECURITY (supabase/schema.sql)
-- Execute this script in the Supabase SQL Editor (Dashboard -> SQL Editor).
-- Idempotent & safe for production multi-tenant deployment with thousands of users.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. UTILITY TRIGGER: AUTO-UPDATE updated_at TIMESTAMP
CREATE OR REPLACE FUNCTION public.tradyx_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- TABLE 1: public.profiles (1:1 with auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'pro_trader')),
    tier TEXT NOT NULL DEFAULT 'Free' CHECK (tier IN ('Free', 'Plus', 'Premium', 'Pro', 'VIP Quant')),
    base_currency_code TEXT NOT NULL DEFAULT 'EUR',
    monthly_budget NUMERIC(16, 2) NOT NULL DEFAULT 10000,
    max_risk_per_trade NUMERIC(14, 2) NOT NULL DEFAULT 200,
    max_risk_type TEXT NOT NULL DEFAULT 'FIXED' CHECK (max_risk_type IN ('PERCENT', 'FIXED')),
    prop_firm_shield_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    prop_firm_max_daily_loss_pct NUMERIC(5, 2) NOT NULL DEFAULT 4.00,
    prop_firm_account_size NUMERIC(16, 2) NOT NULL DEFAULT 100000,
    ulysses_strict_mode BOOLEAN NOT NULL DEFAULT FALSE,
    ulysses_loss_threshold INTEGER NOT NULL DEFAULT 2 CHECK (ulysses_loss_threshold BETWEEN 1 AND 10),
    preferred_market TEXT DEFAULT 'Crypto & Altcoins',
    diagnostic_profile JSONB,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.tradyx_set_updated_at();

-- Auto-create profile row on Supabase Auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
        CASE
            WHEN lower(COALESCE(NEW.email, '')) IN ('riccardosalvia2@gmail.com', 'admin@tradyx.ai') THEN 'admin'
            ELSE 'user'
        END
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- TABLE 2: public.trades (Trading Journal & Behavioral Telemetry)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_pair TEXT NOT NULL CHECK (char_length(asset_pair) BETWEEN 1 AND 32),
    direction TEXT NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    strategy TEXT,
    entry_price NUMERIC(18, 6),
    exit_price NUMERIC(18, 6),
    position_size NUMERIC(18, 6),
    pnl NUMERIC(18, 2) NOT NULL DEFAULT 0,
    roi NUMERIC(10, 4),
    risk_reward TEXT,
    fees NUMERIC(14, 4) DEFAULT 0,
    emotional_state TEXT DEFAULT 'Calm',
    psychology TEXT DEFAULT 'NEUTRAL',
    errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    atlas_macro_context JSONB,
    notes TEXT,
    reasoning TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_user_created
    ON public.trades (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_active
    ON public.trades (user_id, is_deleted, created_at DESC);

DROP TRIGGER IF EXISTS trg_trades_updated_at ON public.trades;
CREATE TRIGGER trg_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.tradyx_set_updated_at();

-- ============================================================================
-- TABLE 3: public.watchlists (Custom Asset & ATLAS Country Hub Watchlists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Principale' CHECK (char_length(name) BETWEEN 1 AND 80),
    symbols JSONB NOT NULL DEFAULT '[]'::jsonb,
    country_hubs JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user
    ON public.watchlists (user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_watchlists_updated_at ON public.watchlists;
CREATE TRIGGER trg_watchlists_updated_at
    BEFORE UPDATE ON public.watchlists
    FOR EACH ROW EXECUTE FUNCTION public.tradyx_set_updated_at();

-- ============================================================================
-- TABLE 4: public.price_alerts (Live Threshold Alerts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL CHECK (char_length(symbol) BETWEEN 1 AND 32),
    target_price NUMERIC(18, 6) NOT NULL CHECK (target_price > 0),
    condition TEXT NOT NULL CHECK (condition IN ('ABOVE', 'BELOW')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    triggered_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user_active
    ON public.price_alerts (user_id, active, created_at DESC);

DROP TRIGGER IF EXISTS trg_price_alerts_updated_at ON public.price_alerts;
CREATE TRIGGER trg_price_alerts_updated_at
    BEFORE UPDATE ON public.price_alerts
    FOR EACH ROW EXECUTE FUNCTION public.tradyx_set_updated_at();

-- ============================================================================
-- TABLE 5: public.ulysses_sessions (Neuro-Behavioral Protocol & Cooldown Audit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ulysses_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger_reason TEXT NOT NULL,
    physiological_state TEXT,
    plan_compliance TEXT,
    procedural_action TEXT,
    cooldown_minutes INTEGER NOT NULL DEFAULT 25 CHECK (cooldown_minutes BETWEEN 0 AND 1440),
    unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    unlocked_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ulysses_sessions_user_created
    ON public.ulysses_sessions (user_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — STRICT MULTI-TENANT ISOLATION ON EVERY TABLE
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ulysses_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles (primary key id = auth.uid())
DROP POLICY IF EXISTS "Users can only access their own data" ON public.profiles;
CREATE POLICY "Users can only access their own data"
    ON public.profiles
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Trades
DROP POLICY IF EXISTS "Users can only access their own data" ON public.trades;
CREATE POLICY "Users can only access their own data"
    ON public.trades
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Watchlists
DROP POLICY IF EXISTS "Users can only access their own data" ON public.watchlists;
CREATE POLICY "Users can only access their own data"
    ON public.watchlists
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Price Alerts
DROP POLICY IF EXISTS "Users can only access their own data" ON public.price_alerts;
CREATE POLICY "Users can only access their own data"
    ON public.price_alerts
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Ulysses Protocol Sessions
DROP POLICY IF EXISTS "Users can only access their own data" ON public.ulysses_sessions;
CREATE POLICY "Users can only access their own data"
    ON public.ulysses_sessions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- REALTIME PUBLICATION (OPTIONAL: ENABLE LIVE SYNC FOR TRADES & ALERTS)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.price_alerts;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;
