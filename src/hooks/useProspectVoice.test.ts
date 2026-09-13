import {act,renderHook} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
vi.mock('@/integrations/supabase/client',()=>({supabase:{auth:{getSession:async()=>({data:{session:null}})}}}));
import {useProspectVoice} from './useProspectVoice';
const notice=vi.hoisted(()=>vi.fn());
vi.mock('@/hooks/use-toast',()=>({toast:notice}));
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('cancelled fetch cannot play or fall back after reset',async()=>{
 vi.useFakeTimers();let complete!: (v:unknown)=>void;const audio=vi.fn();vi.stubGlobal('Audio',audio);
 vi.stubGlobal('fetch',vi.fn(()=>new Promise(resolve=>{complete=resolve;})));
 const {result}=renderHook(()=>useProspectVoice());let done=false;
 await act(async()=>{void result.current.speak('Old session').then(()=>{done=true;});await vi.advanceTimersByTimeAsync(200);});
 act(()=>result.current.stop());
 await act(async()=>{complete({ok:true,arrayBuffer:async()=>new Uint8Array([1]).buffer});});
 expect(audio).not.toHaveBeenCalled();expect(done).toBe(true);
});
it('fallback notice is visible and completion waits for browser speech',async()=>{
 vi.useFakeTimers();notice.mockClear();let utterance:any;
 vi.stubGlobal('speechSynthesis',{cancel:vi.fn(),getVoices:()=>[],speak:(u:any)=>{utterance=u;}});
 vi.stubGlobal('SpeechSynthesisUtterance',class {onend:any;onerror:any;});
 vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('TTS unavailable')));
 const {result}=renderHook(()=>useProspectVoice());let done=false;
 await act(async()=>{void result.current.speak('Hello').then(()=>{done=true;});await vi.advanceTimersByTimeAsync(200);});
 expect(notice).toHaveBeenCalledTimes(1);expect(done).toBe(false);
 await act(async()=>{utterance.onend();});expect(done).toBe(true);
});
it('TTS completion waits for playback, including beyond 15 seconds',async()=>{
 vi.useFakeTimers();
 let audio:any;
 vi.stubGlobal('Audio',class {onended:any;onerror:any;ended=false;paused=false;constructor(){audio=this;}async play(){}pause(){this.paused=true;}removeAttribute(){}load(){}});
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,arrayBuffer:async()=>new Uint8Array([1,2]).buffer}));
 URL.createObjectURL=vi.fn(()=> 'blob:test');URL.revokeObjectURL=vi.fn();
 const {result}=renderHook(()=>useProspectVoice());let done=false;
 await act(async()=>{void result.current.speak('Hello').then(()=>{done=true;});await vi.advanceTimersByTimeAsync(200);});
 await act(async()=>{await vi.advanceTimersByTimeAsync(20000);});
 expect(done).toBe(false);
 await act(async()=>{audio.onended();});
 expect(done).toBe(true);
});
it('stopping playback settles the Budget completion wait',async()=>{
 vi.useFakeTimers();
 vi.stubGlobal('Audio',class {onended:any;onerror:any;async play(){}pause(){}removeAttribute(){}load(){}});
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,arrayBuffer:async()=>new Uint8Array([1]).buffer}));
 URL.createObjectURL=vi.fn(()=> 'blob:test');URL.revokeObjectURL=vi.fn();
 const {result}=renderHook(()=>useProspectVoice());let done=false;
 await act(async()=>{void result.current.speak('Hello').then(()=>{done=true;});await vi.advanceTimersByTimeAsync(200);});
 await act(async()=>{result.current.stop();});expect(done).toBe(true);
});
