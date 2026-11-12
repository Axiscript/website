-- Optional devices used to send daily reports (Phone, Tablet, Laptop).
-- Project: ghvafuxmusfaolzrwefm (https://ghvafuxmusfaolzrwefm.supabase.co)
--
-- Run this once in the Supabase SQL editor AFTER supabase/waitlist.sql,
-- and only when you are ready to publish the waitlist form change.
-- This pull request does not apply it.
--
-- Until this runs, the website form still works. It retries the signup
-- without this field if the column is not in the database yet.
--
-- After this is applied:
--   * report_devices is an optional text array
--   * allowed values are Phone, Tablet, and Laptop (one or more)
--   * anon can insert the new column, and still cannot select, update, or delete

alter table public.waitlist
  add column if not exists report_devices text[];

alter table public.waitlist
  drop constraint if exists waitlist_report_devices_check;

alter table public.waitlist
  add constraint waitlist_report_devices_check
  check (
    report_devices is null
    or (
      cardinality(report_devices) between 1 and 3
      and report_devices <@ array['Phone', 'Tablet', 'Laptop']::text[]
    )
  );

comment on column public.waitlist.report_devices is
  'Optional devices used to send daily reports: Phone, Tablet, and/or Laptop.';

-- Grant is additive. anon already has insert on email, name, work_type, source.
grant insert (report_devices) on table public.waitlist to anon;
