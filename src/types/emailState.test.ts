import { describe, it, expect, vi } from 'vitest';
import { EMAIL_CONFIG as config } from '../../supabase/functions/_shared/prospect/scenarios/email';
import { LEGACY_PERSONAS } from '../../supabase/functions/_shared/legacyScenarios';
import { reduce } from '../../supabase/functions/_shared/prospect/state';
import { handleProspect } from '../../supabase/functions/_shared/prospect/session';
import type { Command, Model, Proposal, ProspectState, Row, Snapshot, Store } from '../../supabase/functions/_shared/prospect/types';

const rep = 'I know you are busy. Is matching delivery paperwork costing you time?';
const proposal = (behaviors: string[]): Proposal => ({text:'Which paperwork?',proposedState:'ENGAGED',deltas:{patience:100,interest:100,trust:100,relevance:100},objectionStatus:'RESOLVED',hangUp:false,nextStepEarned:true,reason:'Quoted behavior',evidence:behaviors.map(behavior=>({behavior,quote:rep,prospectQuote:config.opening}))});
const step = (b:string[], s=config.initialState(), input=rep, elapsed=s.elapsedMs+1000) => reduce(s,proposal(b),input,config.opening,elapsed,config);
class Memory implements Store {
  row: Row | null = null;
  async get() {return structuredClone(this.row);}
  async create(row:Row) {if(this.row)return false;this.row=structuredClone(row);return true;}
  async cas(row:Row,document:Snapshot) {if(this.row?.version!==row.version)return false;this.row=structuredClone({...row,document,version:row.version+1});return true;}
}
const command = (action:Command['action'], extra:Partial<Command>={}):Command => ({sessionId:'email-test',turnId:'t1',owner:'guest:capability-hash',action,expectedTurn:0,input:action==='turn'?rep:'',...extra});
const model:Model = {evaluate:async()=>proposal(['time_acknowledgment','concise_question','specific_relevance']),render:async()=> 'Delivery paperwork does take time. What did you have in mind?'};
async function setup() {const store=new Memory();await handleProspect(command('start'),store,model,config,()=>0);return store;}

describe('Email server-owned policy',()=>{
  it('starts with bounded Email metrics and canonical Keisha identity',()=>{
    expect(config.initialState()).toMatchObject({state:'ANSWERED',patience:65,interest:15,trust:25,relevance:15,turnCount:0});
    expect(config.opening).toBe(LEGACY_PERSONAS.email.openingLine);
    expect(config.personaPrompt).toContain('Keisha Odom, Office Manager at a construction supply company');
  });
  it('rewards a concise relevant question',()=>{expect(step(['concise_question']).relevance).toBe(27);});
  it('rewards acknowledgment of time pressure',()=>{expect(step(['time_acknowledgment'])).toMatchObject({trust:37,primaryObjectionStatus:'ACKNOWLEDGED'});});
  it.each(['generic','ignoring','rambling','many_questions','nonsense','unsupported','contradiction','aggression'])('penalizes %s',behavior=>{
    const next=step([behavior]);expect(next.patience).toBeLessThan(65);expect(next.trust).toBeLessThan(25);expect(next.nextStepEarned).toBe(false);
  });
  it('ends on unearned email-only compliance',()=>{expect(step(['email_only_exit'])).toMatchObject({state:'HUNG_UP',hungUp:true,nextStepEarned:false});});
  it('aggression hangs up immediately',()=>{expect(step(['aggression']).hungUp).toBe(true);});
  it('earns continued engagement gradually',()=>{
    let s=step(['time_acknowledgment','concise_question','specific_relevance']);expect(s.state).toBe('GUARDED');
    s=step(['time_acknowledgment','specific_relevance'],s);expect(s.state).toBe('ENGAGED');expect(s.nextStepEarned).toBe(false);
  });
  it('rejects premature next-step flags and proposed metric manipulation',()=>{expect(step(['appropriate_ask'])).toMatchObject({nextStepEarned:false,trust:25,relevance:15});});
  it('permits a proportionate earned next step',()=>{
    let s=config.initialState();for(let i=0;i<3;i++)s=step(['time_acknowledgment','specific_relevance'],s);
    expect(step(['appropriate_ask'],s)).toMatchObject({state:'NEXT_STEP_EARNED',nextStepEarned:true,objectionsResolved:['email']});
  });
  it('repeated meeting asks degrade state',()=>{const once=step(['meeting_ask']);expect(step(['meeting_ask'],once).patience).toBeLessThan(once.patience);});
  it('positive keywords without anchored evidence never reward state',()=>{expect(step(['concise_question','specific_relevance'],config.initialState(),'ROI relevance trust')).toMatchObject({interest:15,trust:25,relevance:15});});
  it('hard duration terminates',()=>{expect(step([],config.initialState(),rep,120000).hungUp).toBe(true);});
  it('max six turns terminates',()=>{let s=config.initialState();for(let i=0;i<6;i++)s=step([],s);expect(s.hungUp).toBe(true);});
  it('terminal state cannot be reopened',()=>{const s=step(['aggression']);expect(step(['specific_relevance'],s)).toEqual(s);});
  it('bounds metrics',()=>{const s=step(['aggression']);for(const k of ['patience','trust','interest','relevance'] as const){expect(s[k]).toBeGreaterThanOrEqual(0);expect(s[k]).toBeLessThanOrEqual(100);}});
});
describe('Email shared session protocol',()=>{
  it('inactivity persists terminal state',async()=>{const store=await setup();await handleProspect(command('resume',{activitySequence:1}),store,model,config,()=>1000);const r=await handleProspect(command('tick',{activitySequence:1}),store,model,config,()=>16000);expect(r.prospectState?.hungUp).toBe(true);expect(store.row?.document.state.turnCount).toBe(0);});
  it('retries after provider failure once without duplicated state/transcript',async()=>{
    const store=await setup();const broken={...model,evaluate:vi.fn().mockRejectedValue(new Error('provider unavailable'))};
    expect((await handleProspect(command('turn'),store,broken,config,()=>1000)).ok).toBe(false);
    expect(store.row?.document.state).toEqual(config.initialState());expect(store.row?.document.history).toHaveLength(1);
    const accepted=await handleProspect(command('turn'),store,model,config,()=>2000);const saved=structuredClone(store.row);
    expect(await handleProspect(command('turn'),store,model,config,()=>3000)).toEqual(accepted);expect(store.row).toEqual(saved);expect(Object.keys(store.row!.document.receipts)).toHaveLength(1);
  });
  it('new terminal turns reject before provider, but committed receipts replay',async()=>{
    const store=await setup();const accepted=await handleProspect(command('turn'),store,model,config,()=>1000);await handleProspect(command('close',{turnId:'close'}),store,model,config,()=>2000);const saved=structuredClone(store.row);const spy={...model,evaluate:vi.fn(model.evaluate)};
    expect(await handleProspect(command('turn',{turnId:'t2',expectedTurn:1}),store,spy,config,()=>3000)).toMatchObject({ok:false,errorType:'SESSION_CLOSED'});expect(spy.evaluate).not.toHaveBeenCalled();expect(store.row).toEqual(saved);expect(await handleProspect(command('turn'),store,spy,config,()=>3000)).toEqual(accepted);
  });
  it('foreign owner and stale turns reject',async()=>{const store=await setup();expect((await handleProspect(command('turn',{owner:'foreign'}),store,model,config)).ok).toBe(false);expect((await handleProspect(command('turn',{expectedTurn:1}),store,model,config)).ok).toBe(false);});
  it('requires acknowledged pause and rejects reordered activity',async()=>{const store=await setup();await handleProspect(command('resume',{activitySequence:1}),store,model,config,()=>1000);expect((await handleProspect(command('turn',{activitySequence:1}),store,model,config)).ok).toBe(false);await handleProspect(command('pause',{activitySequence:2}),store,model,config,()=>30000);expect((await handleProspect(command('resume',{activitySequence:1}),store,model,config)).ok).toBe(false);expect(store.row?.document.state).toEqual(config.initialState());});
});
