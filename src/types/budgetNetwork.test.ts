import {describe,it,expect,vi} from 'vitest';
import {handleBudget,type Store,type Row,type Snapshot,type Command} from '../../supabase/functions/_shared/budget/session';
import {OPENING,type Proposal} from '../../supabase/functions/_shared/budget/state';
import {BudgetActivityClock} from '../lib/budgetActivityClock';
class Memory implements Store {
 rows=new Map<string,Row>();
 async get(id:string){return structuredClone(this.rows.get(id)??null);}
 async create(row:Row){if(this.rows.has(row.id))return false;this.rows.set(row.id,structuredClone(row));return true;}
 async cas(row:Row,document:Snapshot){if(this.rows.get(row.id)?.version!==row.version)return false;this.rows.set(row.id,structuredClone({...row,version:row.version+1,document}));return true;}
}
const input='Can we measure order rework?';
const proposal:Proposal={text:'What measurement?',proposedState:'GUARDED',deltas:{patience:0,interest:8,trust:0,relevance:15},objectionStatus:'UNADDRESSED',hangUp:false,nextStepEarned:false,reason:'Relevant discovery',evidence:[{behavior:'discovery',quote:input,prospectQuote:OPENING}]};
const model={evaluate:async()=>proposal,render:async()=> 'What measurement?'};
const c=(action:Command['action'],sequence=0):Command=>({sessionId:'network-test',owner:'test-owner',turnId:`${action}-${sequence}`,expectedTurn:0,activitySequence:sequence,action,input:action==='turn'?input:''});
async function opened(){const s=new Memory();await handleBudget(c('start'),s,model,()=>0);return s;}
describe('Phase 2B.2 acknowledged clock acceptance',()=>{
 it.each(['HUNG_UP','NEXT_STEP_EARNED','manual','inactivity','hard-duration','max-turn'] as const)('rejects a new turn after %s without writes or provider work',async cause=>{
  const store=await opened();
  if(cause==='manual') await handleBudget(c('close'),store,model);
  else if(cause==='inactivity' || cause==='hard-duration') {
   await handleBudget(c(cause==='inactivity'?'resume':'engaged',1),store,model,()=>1000);
   await handleBudget(c('tick',1),store,model,()=>cause==='inactivity'?16000:121000);
  } else {
   const row=(await store.get('network-test'))!;
   if(cause==='max-turn') row.document.state.turnCount=5;
   else {row.document.state.state=cause;row.document.state.hungUp=cause==='HUNG_UP';row.document.state.nextStepEarned=cause==='NEXT_STEP_EARNED';}
   await store.cas(row,row.document);
   if(cause==='max-turn') await handleBudget({...c('turn'),expectedTurn:5},store,model);
  }
  const before=(await store.get('network-test'))!;
  expect(before.document.state.hungUp || before.document.state.nextStepEarned).toBe(true);
  const evaluate=vi.fn(model.evaluate),render=vi.fn(model.render);
  const result=await handleBudget({...c('turn'),turnId:'new-terminal-turn',expectedTurn:before.document.state.turnCount},store,{evaluate,render});
  expect(result).toMatchObject({ok:false,errorType:'SESSION_CLOSED',retryable:false});
  expect(result.response).toBeUndefined();expect(result.prospectState).toBeUndefined();
  expect(await store.get('network-test')).toEqual(before);expect(evaluate).not.toHaveBeenCalled();expect(render).not.toHaveBeenCalled();
 });
 it('committed receipt replays after closure, but altered, stale and foreign turns cannot',async()=>{
  const store=await opened();const committed=await handleBudget(c('turn'),store,model);
  await handleBudget(c('close'),store,model);const before=await store.get('network-test');
  expect(await handleBudget(c('turn'),store,model)).toEqual(committed);
  for(const command of [{...c('turn'),input:'altered'}, {...c('turn'),turnId:'stale'}, {...c('turn'),owner:'foreign'}]) expect((await handleBudget(command,store,model)).ok).toBe(false);
  expect(await store.get('network-test')).toEqual(before);
 });
 it('late resume must not undo a newer pause',async()=>{
  const store=await opened();await handleBudget(c('resume',1),store,model,()=>1000);await handleBudget(c('pause',2),store,model,()=>2000);
  expect((await handleBudget(c('resume',1),store,model,()=>3000)).ok).toBe(false);
  expect((await store.get('network-test'))!.document.readyAt).toBeNull();
 });
 it('a lost pause must not charge transcription latency',async()=>{
  const store=await opened();let now=1000;let lost=false;
  const clock=new BudgetActivityClock('network-test',async(action,seq)=>{
   if(action==='pause'&&!lost){lost=true;now=25000;throw new Error('request lost');}
   return {...await handleBudget(c(action,seq),store,model,()=>now)};
  });
  await clock.transition('resume');now=2000;
  const transcribe=vi.fn(async()=>{now+=45000;return 'transcript';});
  await clock.service(transcribe);
  expect(transcribe).toHaveBeenCalledTimes(1);
  const ack=await clock.transition('pause');
  const result=await handleBudget(c('turn',ack.sequence),store,model,()=>now);
  expect(result.prospectState?.hungUp).toBe(false);expect(result.prospectState?.elapsedMs).toBe(0);
 });
 it('late older pause cannot override newer resume',async()=>{
  const store=await opened();await handleBudget(c('pause',1),store,model,()=>1000);await handleBudget(c('resume',2),store,model,()=>2000);const before=await store.get('network-test');
  expect((await handleBudget(c('pause',1),store,model,()=>9000)).ok).toBe(false);expect(await store.get('network-test')).toEqual(before);
 });
 it.each(['pause','resume'] as const)('duplicate %s is idempotent including version and deadline',async action=>{
  const store=await opened();await handleBudget(c(action,1),store,model,()=>1000);const before=await store.get('network-test');
  const result=await handleBudget(c(action,1),store,model,()=>12000);expect(await store.get('network-test')).toEqual(before);expect(result.activityAck).toEqual({sessionId:'network-test',sequence:1,mode:action});
 });
 it('same sequence with a conflicting intent is rejected',async()=>{const store=await opened();await handleBudget(c('pause',1),store,model);expect((await handleBudget(c('resume',1),store,model)).ok).toBe(false);});
 it('lost acknowledgement retries the same pause without applying it twice',async()=>{
  const store=await opened();let calls=0;const sequences:number[]=[];
  const clock=new BudgetActivityClock('network-test',async(action,seq)=>{sequences.push(seq);const r=await handleBudget(c(action,seq),store,model);if(calls++===0)throw new Error('ack lost');return {...r};});
  await clock.transition('pause');expect(sequences).toEqual([1,1]);expect((await store.get('network-test'))!.version).toBe(1);
 });
 it('work is blocked when no pause acknowledgement is obtainable',async()=>{
  const send=vi.fn(async()=>{throw new Error('offline');});const clock=new BudgetActivityClock('network-test',send);const work=vi.fn();
  await expect(clock.service(work)).rejects.toThrow('offline');expect(work).not.toHaveBeenCalled();expect(send).toHaveBeenCalledTimes(3);
 });
 it('manual recovery reuses the failed intent version',async()=>{
  const store=await opened();let offline=true;const sequences:number[]=[];const clock=new BudgetActivityClock('network-test',async(action,seq)=>{sequences.push(seq);if(offline)throw new Error('offline');return {...await handleBudget(c(action,seq),store,model)};});
  await expect(clock.transition('pause')).rejects.toThrow();offline=false;await clock.transition('pause');expect(sequences).toEqual([1,1,1,1]);
 });
 it('session closure rejects subsequent activity messages',async()=>{const store=await opened();await handleBudget(c('close'),store,model);for(const a of ['pause','resume','engaged','tick'] as const)expect((await handleBudget(c(a,1),store,model)).ok).toBe(false);});
 it('another owner or session cannot send activity',async()=>{const store=await opened();expect((await handleBudget({...c('pause',1),owner:'attacker'},store,model)).ok).toBe(false);expect((await handleBudget({...c('pause',1),sessionId:'different'},store,model)).ok).toBe(false);});
 it('normal inactivity still times out',async()=>{const store=await opened();await handleBudget(c('resume',1),store,model,()=>1000);expect((await handleBudget(c('tick',1),store,model,()=>16000)).prospectState?.hungUp).toBe(true);});
 it('stale poll cannot hang up a paused session',async()=>{const store=await opened();await handleBudget(c('resume',1),store,model,()=>1000);await handleBudget(c('pause',2),store,model,()=>2000);expect((await handleBudget(c('tick',1),store,model,()=>60000)).ok).toBe(false);expect((await store.get('network-test'))!.document.state.hungUp).toBe(false);});
 it('unpaused service turn is rejected before invoking the model',async()=>{const store=await opened();await handleBudget(c('resume',1),store,model);const evaluate=vi.fn(model.evaluate);expect((await handleBudget(c('turn',1),store,{...model,evaluate})).ok).toBe(false);expect(evaluate).not.toHaveBeenCalled();});
 it('timeout retry cannot double apply the logical turn',async()=>{
  const store=await opened();await handleBudget(c('turn'),store,{...model,evaluate:async()=>{throw new DOMException('timeout','AbortError');}},()=>5000);
  const a=await handleBudget(c('turn'),store,model,()=>90000);const b=await handleBudget(c('turn'),store,model,()=>100000);expect(a.prospectState?.turnCount).toBe(1);expect(b).toEqual(a);
 });
 it('client rejects an acknowledgement for another session',async()=>{const clock=new BudgetActivityClock('network-test',async()=>({ok:true,activityAck:{sessionId:'different',sequence:1,mode:'pause'}}));await expect(clock.service(vi.fn())).rejects.toThrow();});
 it('a superseded in-flight acknowledgement cannot start service work',async()=>{
  let release!:()=>void;
  const clock=new BudgetActivityClock('network-test',async(action,sequence)=>{
   if(sequence===1)await new Promise<void>(resolve=>{release=resolve;});
   return {ok:true,activityAck:{sessionId:'network-test',sequence,mode:action as 'pause'|'resume'}};
  });
  const work=vi.fn();const pending=clock.service(work);const rejected=expect(pending).rejects.toThrow();
  await clock.transition('resume');release();await rejected;expect(work).not.toHaveBeenCalled();
 });
 it('closing the client fences a pending pause acknowledgement',async()=>{
  let release!:()=>void;
  const clock=new BudgetActivityClock('network-test',async(_action,sequence)=>{await new Promise<void>(resolve=>{release=resolve;});return {ok:true,activityAck:{sessionId:'network-test',sequence,mode:'pause'}};});
  const work=vi.fn();const pending=clock.service(work);const rejected=expect(pending).rejects.toThrow();clock.close();release();await rejected;expect(work).not.toHaveBeenCalled();
 });

});
