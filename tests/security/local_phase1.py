"""Local-only REST/RPC checks with two genuine Auth identities. Never prints keys/JWTs.
Requires phase1-fixture.sql + the security migration in the isolated local DB.
Uses the existing temporary local Supabase status JSON; no production fallback.
"""
import json, tempfile, uuid, urllib.request, urllib.error
from pathlib import Path

raw = (Path(tempfile.gettempdir()) / 'pp-budget-status.json').read_bytes()
config = json.loads(raw.decode('utf-16' if raw.startswith(b'\xff\xfe') else 'utf-8-sig'))
base = config['API_URL']
assert base == 'http://127.0.0.1:54321', 'Only isolated localhost is allowed'
service = config['SERVICE_ROLE_KEY']
anon = config['ANON_KEY']
def request(path, body=None, token=None, method=None):
    req = urllib.request.Request(base + path, data=None if body is None else json.dumps(body).encode(),
        headers={'apikey': anon, 'Authorization': 'Bearer ' + (token or anon), 'Content-Type':'application/json'}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.status, json.loads(response.read() or b'null')
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read() or b'null')
def user():
    email='security-qa-'+uuid.uuid4().hex+'@example.com';password=uuid.uuid4().hex+'Aa1!'
    status, created=request('/auth/v1/admin/users', {'email':email,'password':password,'email_confirm':True},service)
    assert status < 300, 'Local fixture user creation failed'
    status, login=request('/auth/v1/token?grant_type=password',{'email':email,'password':password})
    assert status == 200, 'Local fixture login failed'
    return created['id'],login['access_token']
checks=[]
def check(name, condition):
    checks.append(bool(condition));print(name, 'PASS' if condition else 'FAIL',flush=True)

a, ajwt=user();b, bjwt=user()
for uid in (a,b):
    status,_=request('/rest/v1/voice_rate_limits',{'id':uid,'user_id':uid},service)
    assert status < 300
for uid,token,other in [(a,ajwt,b),(b,bjwt,a)]:
    status, rows=request('/rest/v1/voice_rate_limits',token=token)
    check('Authenticated owner reads only own row',status==200 and [r['user_id'] for r in rows]==[uid])
    status,rows=request('/rest/v1/voice_rate_limits?user_id=eq.'+other,token=token)
    check('Other user row hidden',status==200 and rows==[])
status,rows=request('/rest/v1/voice_rate_limits')
check('Public anon cannot enumerate',status in (401,403) or (status==200 and rows==[]))
status,_=request('/rest/v1/voice_rate_limits?id=eq.'+a,{'request_count':2},service,'PATCH')
check('Service role manages quota row',status<300)
for token in (anon,ajwt):
    status,_=request('/rest/v1/security_logs',{'user_id':a,'event_type':'forged'},token)
    check('Direct audit insert denied',status in (401,403))
    status,_=request('/rest/v1/rpc/log_security_event',{'p_event_type':'forged','p_user_id':a},token)
    check('Trusted audit RPC denied',status in (401,403,404))
status,_=request('/rest/v1/rpc/report_client_security_event',{'p_event_type':'forged'})
check('Public reporter denied',status in (401,403,404))
status,_=request('/rest/v1/rpc/report_client_security_event',{'p_event_type':'csp_violation','p_event_details':{'source':'trusted'}},ajwt)
check('Authenticated diagnostic accepted',status<300)
status,rows=request('/rest/v1/security_logs?user_id=eq.'+a,token=service)
check('Report provenance cannot be forged',status==200 and len(rows)==1 and rows[0]['event_type']=='client_report' and rows[0]['event_details']['source']=='untrusted_client')
status,_=request('/rest/v1/rpc/report_client_security_event',{'p_event_type':'event','p_user_id':b},ajwt)
check('Report identity spoof denied',status in (401,403))
status,_=request('/rest/v1/rpc/log_security_event',{'p_event_type':'trusted_local_test','p_user_id':b},service)
check('Service audit RPC works',status<300)
print('TOTAL',len(checks),'PASSED',sum(checks),'FAILED',len(checks)-sum(checks))
raise SystemExit(0 if all(checks) else 1)
