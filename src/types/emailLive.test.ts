import { it, expect, vi } from 'vitest';
import { prospectRequest } from '../../supabase/functions/_shared/prospect/adapter';
import type { Row, Snapshot, Store, Result } from '../../supabase/functions/_shared/prospect/types';
class Memory implements Store {
  row:Row|null=null;
  async get(){return structuredClone(this.row);}
  async create(row:Row){if(this.row)return false;this.row=structuredClone(row);return true;}
  async cas(row:Row,document:Snapshot){if(this.row?.version!==row.version)return false;this.row=structuredClone({...row,document,version:row.version+1});return true;}
}
const cases={
  relevant:'I know you are busy, so just one question before an email: does matching delivery paperwork to orders take up time in your office?',
  compliance:'Sounds good, I will just email you. Thanks, goodbye.',
  aggressive:'You are an idiot. Stop wasting my time and buy this now.',
  nonsense:'Email relevance trust ROI purple banana discovery proof calendar unicorn.',
};
it.skipIf(process.env.EMAIL_LIVE!=='1').each(Object.entries(cases))('live Email: %s',async(name,input)=>{
  expect(process.env.OPENAI_API_KEY).toBeTruthy();const store=new Memory();
  const nativeFetch=globalThis.fetch; let classification:unknown;
  const spy=vi.spyOn(globalThis,'fetch').mockImplementation(async(url,init)=>{const response=await nativeFetch(url,init);if(JSON.parse(String(init?.body)).response_format)classification=(await response.clone().json()).choices?.[0]?.message?.content;return response;});
  const request=(action:string,userInput:string)=>prospectRequest({scenarioId:'email',owner:'local-email-test',db:null,key:process.env.OPENAI_API_KEY!,storeOverride:store,body:{sessionId:`email-${name}`,turnId:action==='start'?'opening':'t1',budgetAction:action,budgetVersion:0,userInput}}) as Promise<Result>;
  expect((await request('start','')).ok).toBe(true);const r=await request('turn',input);spy.mockRestore();expect(r.ok,r.errorType).toBe(true);expect(r.prospectState?.turnCount).toBe(1);expect(Object.keys(store.row!.document.receipts)).toHaveLength(1);
  if(name==='relevant'){expect(r.prospectState!.relevance, JSON.stringify(classification)).toBeGreaterThan(15);expect(r.prospectState!.nextStepEarned).toBe(false);}
  if(name==='compliance'||name==='aggressive')expect(r.prospectState!.hungUp).toBe(true);
  if(name==='nonsense'){expect(r.prospectState!.relevance).toBeLessThanOrEqual(15);expect(r.prospectState!.nextStepEarned).toBe(false);}
},120000);
