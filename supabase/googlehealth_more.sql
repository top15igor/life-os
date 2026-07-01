-- More Google Health / Fitbit metrics for health_metrics:
-- sleep stages (deep / REM / light minutes), active zone minutes.
-- (hr_avg and hrv columns already exist.)
alter table health_metrics add column if not exists sleep_deep_min  integer;
alter table health_metrics add column if not exists sleep_rem_min   integer;
alter table health_metrics add column if not exists sleep_light_min integer;
alter table health_metrics add column if not exists azm             integer;
