#!/usr/bin/env bash
# ==============================================================================
# Resonology AI / IntelliCall: Supabase Cloud Deployment Utility (Bash / Linux / Mac / WSL)
# ==============================================================================
set -euo pipefail

PROJECT_REF="wdmensuuqsbnxzecqlwz"

echo "=========================================================="
echo "  Resonology AI: Supabase Cloud Sync Utility"
echo "  Target: $PROJECT_REF (South Asia - Mumbai)"
echo "=========================================================="

# 1. Verify CLI
if ! command -v supabase &> /dev/null; then
    echo "[!] Supabase CLI not found. Install via 'npm install -g supabase' or 'brew install supabase/tap/supabase'"
    exit 1
fi

echo "[✓] Supabase CLI found: $(supabase --version)"

# 2. Check Linked State
echo ""
echo "[1/4] Verifying project link..."
if supabase projects list | grep -q "$PROJECT_REF"; then
    echo "[✓] Terminal linked to $PROJECT_REF"
else
    echo "[!] Linking terminal to $PROJECT_REF..."
    supabase link --project-ref "$PROJECT_REF"
fi

# 3. Database Migrations
echo ""
echo "[2/4] Pushing forward-only migrations to cloud database..."
supabase db push

# 4. Deploy Edge Functions
echo ""
echo "[3/4] Deploying Edge Functions..."
supabase functions deploy analysis-run --no-verify-jwt

# 5. Summary
echo ""
echo "[4/4] Remote verification status:"
supabase migration list
supabase functions list

echo ""
echo "=========================================================="
echo "  Cloud Synchronization Complete!"
echo "=========================================================="
