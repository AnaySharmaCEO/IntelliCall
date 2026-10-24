# IntelliCall — Supabase Cloud Migration Guide
**Project Reference**: `<YOUR_PROJECT_REF>` (obtain from your Supabase Dashboard)  
**Supabase URL**: `https://<YOUR_PROJECT_REF>.supabase.co`  
**Anon Key**: `<YOUR_SUPABASE_ANON_KEY>` (found in Supabase Dashboard > Project Settings > API)  

---

## Choose Your Execution Method

You have two simple ways to execute the migrations on your Supabase Cloud project:

---

### Option A: 1-Click via Supabase Web Dashboard (Fastest & No CLI Setup Needed)

1. Open your browser and navigate to your project's SQL Editor:
   👉 **Supabase SQL Editor**: `https://supabase.com/dashboard/project/<YOUR_PROJECT_REF>/sql/new`
2. Open the consolidated migration file:
   [`supabase/apply_all_migrations.sql`](file:///c:/Users/beast/OneDrive/Documents/Anay%20Sharma/Projects/3RD%20Year%20Project/resonology-ai-public/supabase/apply_all_migrations.sql)
3. Copy the entire contents of `apply_all_migrations.sql` and paste it into the SQL editor window.
4. Click the green **"RUN"** button (or press `Ctrl + Enter`).
5. **Done!** All 15 tables, enums, RLS policies, triggers, the `call-recordings` storage bucket, and Data API (PostgREST) permissions will be configured in a single transaction.
6. **Data API Enabled**: Tables must have Data API access enabled so `@supabase/supabase-js` can query them. Row Level Security (RLS) is what keeps data locked to each organization.

---

### Option B: Automated via PowerShell Script (Applies Migrations + Deploys Edge Functions)

If you have the Supabase CLI installed, run the automated script in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\supabase\deploy.ps1
```

This script will automatically:
1. Authenticate with Supabase Cloud (`supabase login` if not already logged in).
2. Link your local project to `<YOUR_PROJECT_REF>`: `supabase link --project-ref <YOUR_PROJECT_REF>`.
3. Push all migration files in `supabase/migrations/` in sequence (`supabase db push`).
4. Deploy the 4 Edge Functions:
   - `handle-call-webhook`
   - `process-ai-decision`
   - `handle-appointment-webhook`
   - `trigger-scheduled-calls`

---

### Option C: Step-by-Step Supabase CLI Commands

If you prefer running the commands manually:

```powershell
# 1. Log in to Supabase CLI (if not already logged in)
supabase login

# 2. Link your workspace to your Supabase Cloud project
supabase link --project-ref <YOUR_PROJECT_REF>

# 3. Push all migrations to your cloud database
supabase db push

# 4. Deploy the 4 Edge Functions
supabase functions deploy handle-call-webhook --no-verify-jwt
supabase functions deploy process-ai-decision --no-verify-jwt
supabase functions deploy handle-appointment-webhook --no-verify-jwt
supabase functions deploy trigger-scheduled-calls --no-verify-jwt
```

---

## Post-Migration Verification Checklist

In your [Supabase Cloud Dashboard](https://supabase.com/dashboard/project/<YOUR_PROJECT_REF>):

- [ ] **Table Editor** (`/editor`): Confirm all 15 tables exist:
  - `profiles`, `organizations`, `organization_members`
  - `agents`, `campaigns`, `leads`, `campaign_leads`, `lead_status_history`
  - `calls`, `transcripts`, `transcript_turns`
  - `decisions`, `evidence_signals`, `actions`, `outcomes`, `appointments`, `follow_ups`, `audit_log`
- [ ] **Authentication** (`/auth/policies`): Verify RLS is enabled on all tables, including the creator-owner first member policy on `organization_members`.
- [ ] **Organizations Table**: Confirm `created_by`, `onboarding_completed`, and `onboarding_progress` columns exist.
- [ ] **Storage** (`/storage/buckets`): Confirm the private bucket `call-recordings` exists.
- [ ] **Edge Functions** (`/functions`): Confirm the 4 edge functions are listed (if deployed via CLI).
