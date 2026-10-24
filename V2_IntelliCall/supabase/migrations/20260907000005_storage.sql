-- ============================================================================
-- IntelliCall: 05 Storage Bucket & Policies (call-recordings)
-- ============================================================================

-- Create private bucket for call recordings if it does not exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'call-recordings',
  'call-recordings',
  false,
  52428800, -- 50MB
  array['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800;

-- ----------------------------------------------------------------------------
-- Storage RLS Policies
-- Path convention: {organization_id}/{call_id}.wav
-- ----------------------------------------------------------------------------

-- Org members can view / download their org's recordings
create policy "Org members can read call recordings"
  on storage.objects for select
  using (
    bucket_id = 'call-recordings'
    and auth.role() = 'authenticated'
    and (
      -- Extract organization_id from path: {organization_id}/{call_id}.wav
      is_org_member(((regexp_split_to_array(name, '/'))[1])::uuid)
    )
  );

-- Org members can upload to their org's folder
create policy "Org members can upload call recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'call-recordings'
    and auth.role() = 'authenticated'
    and (
      is_org_member(((regexp_split_to_array(name, '/'))[1])::uuid)
    )
  );

-- Org admins can delete recordings
create policy "Org admins can delete call recordings"
  on storage.objects for delete
  using (
    bucket_id = 'call-recordings'
    and auth.role() = 'authenticated'
    and (
      has_org_role(((regexp_split_to_array(name, '/'))[1])::uuid, 'admin')
    )
  );

-- Service role has full access to all recordings
create policy "Service role has full access to recordings"
  on storage.objects for all
  using (
    bucket_id = 'call-recordings'
    and auth.jwt()->>'role' = 'service_role'
  );
