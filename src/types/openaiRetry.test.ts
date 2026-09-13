import {afterEach,expect,it,vi} from 'vitest';
import {fetchOpenAI} from '../../supabase/functions/_shared/openaiRetry';
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
it.each([500,502,429])('retries transient %s only once',async status=>{
 vi.useFakeTimers();const send=vi.fn().mockResolvedValueOnce(new Response('rate_limit_exceeded',{status})).mockResolvedValueOnce(new Response('{}'));
 vi.stubGlobal('fetch',send);const result=fetchOpenAI('https://api.openai.com/test',{});await vi.advanceTimersByTimeAsync(500);expect((await result).ok).toBe(true);expect(send).toHaveBeenCalledTimes(2);
});
it.each(['insufficient_quota','billing_hard_limit_reached','insufficient credits','credit balance exhausted'])('quota %s fails fast',async body=>{
 const send=vi.fn().mockResolvedValue(new Response(body,{status:429}));vi.stubGlobal('fetch',send);expect((await fetchOpenAI('https://api.openai.com/test',{})).status).toBe(429);expect(send).toHaveBeenCalledTimes(1);
});
it('network failure retries once within the same deadline',async()=>{
 vi.useFakeTimers();const send=vi.fn().mockRejectedValueOnce(new TypeError('network')).mockResolvedValue(new Response('{}'));vi.stubGlobal('fetch',send);const result=fetchOpenAI('https://api.openai.com/test',{});await vi.advanceTimersByTimeAsync(500);expect((await result).ok).toBe(true);expect(send).toHaveBeenCalledTimes(2);
});
it('caller cancellation does not invoke provider',async()=>{
 const send=vi.fn();vi.stubGlobal('fetch',send);const c=new AbortController();c.abort();await expect(fetchOpenAI('https://api.openai.com/test',{signal:c.signal})).rejects.toThrow();expect(send).not.toHaveBeenCalled();
});
it('hung response body is bounded and not retried',async()=>{
 vi.useFakeTimers();const send=vi.fn(async(_url,init)=>({arrayBuffer:()=>new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('timeout','AbortError'))))}));vi.stubGlobal('fetch',send);
 const result=fetchOpenAI('https://api.openai.com/test',{});const rejected=expect(result).rejects.toThrow();await vi.advanceTimersByTimeAsync(25000);await rejected;expect(send).toHaveBeenCalledTimes(1);
});
