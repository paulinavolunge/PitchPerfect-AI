import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, it, expect } from 'vitest';
let db:PGlite;
const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222';
async function identity(role:string,uid='') {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','${uid}',false); SELECT set_config('request.jwt.claim.role','${role}',false); SET ROLE ${role};`);
}
beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('request.jwt.claim.role',true)$$;
    GRANT USAGE ON SCHEMA auth TO public;`);
  await db.exec(readFileSync('tests/security/phase1-fixture.sql','utf8'));
  await identity('authenticated',A);
  expect((await db.query('SELECT * FROM public.voice_rate_limits')).rows).toHaveLength(2);
  await identity('anon');await db.exec("INSERT INTO public.security_logs(event_type) VALUES('forged_before_fix')");
  await db.exec('RESET ROLE');
  await db.exec(readFileSync('supabase/migrations/20260924171220_security_phase1_rate_limits_and_audit.sql','utf8'));
},30000);
afterAll(async()=>{await db.close();});
it.each([A,B])('ordinary user %s reads only their own row',async uid=>{
  await identity('authenticated',uid);expect((await db.query('SELECT user_id FROM public.voice_rate_limits')).rows).toEqual([{user_id:uid}]);
});
it.each(['anon','authenticated'])('%s without an owned row cannot enumerate',async role=>{
  await identity(role,role==='authenticated'?'44444444-4444-4444-8444-444444444444':'');expect((await db.query('SELECT * FROM public.voice_rate_limits')).rows).toEqual([]);
});
it('verified admin retains visibility',async()=>{await identity('authenticated','33333333-3333-4333-8333-333333333333');expect((await db.query('SELECT * FROM public.voice_rate_limits')).rows).toHaveLength(2);});
it('service role retains management and trusted audit writes',async()=>{
  await identity('service_role');expect((await db.query('UPDATE public.voice_rate_limits SET request_count=1 RETURNING id')).rows).toHaveLength(2);
  await db.exec("SELECT public.log_security_event('trusted_event','{}',null)");
  expect((await db.query("SELECT * FROM public.security_logs WHERE event_type='trusted_event'")).rows).toHaveLength(1);
});
it.each(['anon','authenticated'])('%s cannot forge trusted logs',async role=>{
  await identity(role,role==='authenticated'?A:'');
  await expect(db.exec("INSERT INTO public.security_logs(event_type,user_id) VALUES('forged','11111111-1111-4111-8111-111111111111')")).rejects.toThrow();
  await expect(db.exec("SELECT public.log_security_event('forged','{}',null)")).rejects.toThrow();
});
it('anon cannot invoke client reporter',async()=>{await identity('anon');await expect(db.exec("SELECT public.report_client_security_event('forged','{}',null)")).rejects.toThrow();});
it('reports are identity-bound and untrusted regardless of claimed event',async()=>{
  await identity('authenticated',A);await db.exec("SELECT public.report_client_security_event('admin_initialized','{\"source\":\"trusted\"}',null)");
  await db.exec('RESET ROLE');expect((await db.query("SELECT user_id,event_type,event_details FROM public.security_logs WHERE event_type='client_report'")).rows).toEqual([{user_id:A,event_type:'client_report',event_details:{source:'untrusted_client',reported_event_type:'admin_initialized',reported_details:{source:'trusted'}}}]);
});
it('rejects forged identity and oversized reports',async()=>{
  await identity('authenticated',A);
  await expect(db.query('SELECT public.report_client_security_event($1,$2,$3)',['event','{}',B])).rejects.toThrow();
  await expect(db.query('SELECT public.report_client_security_event($1,$2,null)',['event',JSON.stringify({text:'x'.repeat(6000)})])).rejects.toThrow();
});
