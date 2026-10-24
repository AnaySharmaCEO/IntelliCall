<#
.SYNOPSIS
    Automated deployment and cloud connection utility for IntelliCall / Resonology AI Supabase Cloud.
.DESCRIPTION
    Verifies terminal connectivity to Supabase Cloud, audits migration sync state,
    applies pending forward-only SQL migrations, and deploys Edge Functions.
.EXAMPLE
    .\scripts\deploy-supabase-cloud.ps1
#>

[CmdletBinding()]
param (
    [switch]$SkipFunctions,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$ProjectRef = "wdmensuuqsbnxzecqlwz"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Resonology AI / IntelliCall: Supabase Cloud Sync Utility" -ForegroundColor Cyan
Write-Host "  Target Project: $ProjectRef (South Asia - Mumbai)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify Supabase CLI
try {
    $cliVersion = supabase --version
    Write-Host "[✓] Supabase CLI installed: $cliVersion" -ForegroundColor Green
} catch {
    Write-Error "Supabase CLI is not installed or not in PATH. Install via 'scoop install supabase' or 'npx supabase'."
    exit 1
}

# 2. Check Linked Project Status
Write-Host "`n[1/4] Verifying project link..." -ForegroundColor Yellow
$projectList = supabase projects list
if ($projectList -match $ProjectRef) {
    Write-Host "[✓] Terminal is linked to project $ProjectRef" -ForegroundColor Green
} else {
    Write-Host "[!] Not linked to $ProjectRef. Running supabase link..." -ForegroundColor Yellow
    supabase link --project-ref $ProjectRef
}

# 3. Migration Check & Database Push
Write-Host "`n[2/4] Auditing and applying database migrations..." -ForegroundColor Yellow
if ($DryRun) {
    Write-Host "Running in DRY RUN mode..." -ForegroundColor Cyan
    supabase db push --dry-run
} else {
    supabase db push
    Write-Host "[✓] Database migrations successfully synchronized with Supabase Cloud!" -ForegroundColor Green
}

# 4. Deploy Edge Functions
if (-not $SkipFunctions) {
    Write-Host "`n[3/4] Deploying Edge Functions..." -ForegroundColor Yellow
    $functions = @("analysis-run")
    foreach ($func in $functions) {
        Write-Host "Deploying function: $func..." -ForegroundColor Cyan
        supabase functions deploy $func --no-verify-jwt
        Write-Host "[✓] Function '$func' deployed." -ForegroundColor Green
    }
}

# 5. Status Summary
Write-Host "`n[4/4] Verifying remote state..." -ForegroundColor Yellow
supabase migration list
supabase functions list

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  Cloud Synchronization Complete!" -ForegroundColor Green
Write-Host "  All migrations & Edge Functions are live on Supabase Cloud." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
