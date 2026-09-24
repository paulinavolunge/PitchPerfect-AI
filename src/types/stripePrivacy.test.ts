import { expect, it, vi } from 'vitest';
import { createVerifyStripeSessionHandler } from '../../supabase/functions/_shared/verifyStripeSession';
const request = (body: unknown) => new Request('http://localhost/verify', {method:'POST', body:JSON.stringify(body)});
it('unlocks a valid purchase without disclosing email or customer identifiers', async () => {
  const retrieve = vi.fn().mockResolvedValue({payment_status:'paid',status:'complete',mode:'payment',amount_total:499,customer_details:{email:'private@example.com'},customer_email:'other@example.com',customer:'cus_private'});
  const response=await createVerifyStripeSessionHandler(retrieve)(request({session_id:'cs_test_valid'}));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({paid:true,mode:'payment',amountTotal:499,productLabel:'Starter Pack — 5 rounds'});
  expect(retrieve).toHaveBeenCalledWith('cs_test_valid');
});
it('keeps unpaid sessions locked',async()=>{
  const response=await createVerifyStripeSessionHandler(async()=>({payment_status:'unpaid',status:'open',mode:'payment',amount_total:499}))(request({session_id:'cs_test_unpaid'}));
  expect((await response.json()).paid).toBe(false);
});
it('rejects missing and non-string checkout ids before Stripe',async()=>{
  const retrieve=vi.fn();const handler=createVerifyStripeSessionHandler(retrieve);
  for(const session_id of [null,'',123,{}])expect((await handler(request({session_id}))).status).toBe(400);
  expect(retrieve).not.toHaveBeenCalled();
});
it('rejects invalid Stripe sessions without reflecting provider errors',async()=>{
  const response=await createVerifyStripeSessionHandler(async()=>{throw new Error('private@example.com')})(request({session_id:'invalid'}));
  expect(response.status).toBe(400);expect(await response.json()).toEqual({error:'Verification failed'});
});
