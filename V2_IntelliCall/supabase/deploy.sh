#!/usr/bin/env bash
set -euo pipefail

PROJECT_REF="${1:-${SUPABASE_PROJECT_REF:-}}"
if [ -z "${PROJECT_REF}" ]; then
    echo "ERROR: PROJECT_REF is required."
    echo "Usage: ./supabase/deploy.sh <YOUR_PROJECT_REF>"
    echo "Or set the environment variable SUPABASE_PROJECT_REF"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=========================================================="
echo "  IntelliCall - Supabase Cloud Deployment & Migrations    "
echo "  Target Project: ${PROJECT_REF}                          "
echo "=========================================================="

# 1. Check CLI
echo -e "\n[Step 1/5] Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "ERROR: Supabase CLI is not installed or not in PATH."
    echo "Install via: npm install -g supabase or brew install supabase/tap/supabase"
    exit 1
fi

echo "Supabase CLI: $(supabase --version)"

# 2. Check Auth
echo -e "\n[Step 2/5] Checking Authentication..."
if ! supabase projects list &> /dev/null; then
    echo "Logging into Supabase CLI..."
    supabase login
fi

# 3. Link project
echo -e "\n[Step 3/5] Linking to project ${PROJECT_REF}..."
cd "${PROJECT_ROOT}"
supabase link --project-ref "${PROJECT_REF}"

# 4. Push migrations
echo -e "\n[Step 4/5] Pushing migrations..."
supabase db push

# 5. Deploy Edge Functions (if present in workspace)
echo -e "\n[Step 5/5] Deploying Edge Functions..."
FUNCTIONS=("handle-call-webhook" "process-ai-decision" "handle-appointment-webhook" "trigger-scheduled-calls")
DEPLOYED_COUNT=0
for fn in "${FUNCTIONS[@]}"; do
    if [ -d "${SCRIPT_DIR}/functions/${fn}" ]; then
        echo "Deploying ${fn}..."
        supabase functions deploy "${fn}" --project-ref "${PROJECT_REF}" --no-verify-jwt
        DEPLOYED_COUNT=$((DEPLOYED_COUNT + 1))
    fi
done

if [ "$DEPLOYED_COUNT" -eq 0 ]; then
    echo "  (Proprietary edge functions are not present in this workspace; skipping functions deployment)"
fi

echo "=========================================================="
echo "  SUCCESS: IntelliCall Cloud Backend Deployed!            "
echo "=========================================================="
echo "Dashboard: https://supabase.com/dashboard/project/${PROJECT_REF}"
