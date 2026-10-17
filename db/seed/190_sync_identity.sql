-- =====================================================================
-- 190 · Move every identity sequence past the highest seeded id
-- (seeds insert explicit ids with OVERRIDING SYSTEM VALUE)
-- =====================================================================

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND is_identity = 'YES'
  LOOP
    EXECUTE format(
      'SELECT setval(pg_get_serial_sequence(%L, %L), COALESCE((SELECT max(%I) FROM %I), 0) + 1, false)',
      r.table_name, r.column_name, r.column_name, r.table_name
    );
  END LOOP;
END $$;

-- booking_code_seq (050) continues after the highest seeded BK-nnnn code
SELECT setval(
  'booking_code_seq',
  COALESCE((SELECT max(substring(booking_code FROM '^BK-([0-9]+)$')::int) FROM booking), 0) + 1,
  false
);
