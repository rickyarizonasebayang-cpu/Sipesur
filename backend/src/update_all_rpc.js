import https from 'https';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_KEY;

function callRpc(funcName, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/${funcName}`);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : null);
        } else {
          reject(new Error(`[${res.statusCode}] ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

const execDDL = `
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
`;

const insertDDL = `
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
`;

async function main() {
  console.log('1. Updating sipesur_exec...');
  try {
    const res1 = await callRpc('sipesur_mutate', { query: execDDL });
    console.log('sipesur_exec updated:', res1);
  } catch (e) {
    console.error('sipesur_exec failed:', e.message);
  }

  console.log('2. Updating sipesur_insert...');
  try {
    const res2 = await callRpc('sipesur_mutate', { query: insertDDL });
    console.log('sipesur_insert updated:', res2);
  } catch (e) {
    console.error('sipesur_insert failed:', e.message);
  }
}

main();
