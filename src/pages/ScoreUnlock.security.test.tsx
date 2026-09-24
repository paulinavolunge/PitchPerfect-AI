import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const mocks=vi.hoisted(()=>({invoke:vi.fn(),signUp:vi.fn(),toast:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{functions:{invoke:mocks.invoke},auth:{signUp:mocks.signUp}}}));
vi.mock('@/context/AuthContext',()=>({useAuth:()=>({user:null})}));
vi.mock('@/hooks/use-toast',()=>({useToast:()=>({toast:mocks.toast})}));
vi.mock('react-helmet-async',()=>({Helmet:()=>null}));
import ScoreUnlock from './ScoreUnlock';
beforeEach(()=>{vi.clearAllMocks();localStorage.clear();mocks.invoke.mockResolvedValue({data:{paid:true,mode:'payment',amountTotal:499,productLabel:'Starter Pack — 5 rounds'},error:null});});
const mount=()=>render(<MemoryRouter initialEntries={['/scorecard-unlock?session_id=cs_test']}><ScoreUnlock/></MemoryRouter>);
it('valid purchase unlocks with no email returned',async()=>{
  mount();await screen.findByText('Your AI Cold Call Scorecard is Unlocked');
  expect(screen.getByLabelText('Checkout email')).toHaveValue('');
  expect(mocks.invoke).toHaveBeenCalledWith('verify-stripe-session',{body:{session_id:'cs_test'}});
});
it('signup uses buyer-entered checkout email, not response data',async()=>{
  mocks.signUp.mockResolvedValue({data:{user:{id:'test'},session:null},error:null});mount();
  fireEvent.change(await screen.findByLabelText('Checkout email'),{target:{value:'buyer@example.com'}});
  fireEvent.change(screen.getByPlaceholderText('At least 6 characters'),{target:{value:'test-password'}});
  fireEvent.click(screen.getByRole('button',{name:/Create Account/}));
  await waitFor(()=>expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({email:'buyer@example.com'})));
});
it.each([{data:{paid:false},error:null},{data:null,error:{message:'invalid'}}])('invalid/unpaid verification stays locked',async result=>{
  mocks.invoke.mockResolvedValue(result);mount();await screen.findByText("We couldn't verify that purchase");
  expect(screen.queryByText('Your AI Cold Call Scorecard is Unlocked')).toBeNull();
});
