import db from './db.js';

const sql = `
CREATE OR REPLACE FUNCTION sipesur_exec(query text, params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  BEGIN
    EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t'
    INTO result;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL Error: % | Query: %', SQLERRM, left(query, 200);
  END;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION sipesur_insert(query text, params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  insert_query text;
BEGIN
  insert_query := query;
  IF position('RETURNING' IN upper(query)) = 0 THEN
    insert_query := query || ' RETURNING id';
  END IF;

  BEGIN
    EXECUTE 'WITH t AS (' || insert_query || ') SELECT jsonb_agg(row_to_json(t)) FROM t'
    INTO result;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL Error: % | Query: %', SQLERRM, left(query, 200);
  END;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION sipesur_mutate(query text, params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rc int;
BEGIN
  BEGIN
    EXECUTE query;
    GET DIAGNOSTICS rc = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL Error: % | Query: %', SQLERRM, left(query, 200);
  END;

  RETURN jsonb_build_object('rowCount', rc, 'affectedRows', rc);
END;
$$;

GRANT EXECUTE ON FUNCTION sipesur_exec(text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION sipesur_insert(text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION sipesur_mutate(text, jsonb) TO anon, authenticated;
`;

async function main() {
  try {
    await db.query(sql);
    console.log('[OK] RPC functions updated to direct execution mode!');
  } catch (err) {
    console.error('[ERR]', err.message);
  }
}

main();
