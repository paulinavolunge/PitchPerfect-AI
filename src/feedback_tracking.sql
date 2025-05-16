
-- Table to store user feedback for AI sessions
create table if not exists public.user_feedback (
  id uuid not null default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text not null,
  feedback_type text not null,
  is_helpful boolean not null,
  created_at timestamp with time zone default now(),

  primary key (id),
  constraint valid_feedback_type check (feedback_type in ('roleplay', 'practice', 'demo'))
);

-- Default RLS policy: Users can only insert their own feedback
create policy "Users can insert their own feedback"
  on user_feedback
  for insert
  with check (auth.uid() = user_id);

-- Allow authenticated users to select their own feedback
create policy "Users can view their own feedback"
  on user_feedback
  for select
  using (auth.uid() = user_id);

-- Admins can view all feedback (requires admin role setup)
create policy "Admins can view all feedback"
  on user_feedback
  for select
  using (is_admin());

-- Create a function to check if a user is an admin
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from user_roles
    where user_id = auth.uid()
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Create a view for analytics
create or replace view feedback_analytics as
select
  date_trunc('day', created_at) as day,
  feedback_type,
  count(*) as total_feedback,
  sum(case when is_helpful then 1 else 0 end) as helpful_count,
  sum(case when not is_helpful then 1 else 0 end) as unhelpful_count,
  (sum(case when is_helpful then 1 else 0 end)::float / count(*)::float) * 100 as helpful_percentage
from
  user_feedback
group by
  date_trunc('day', created_at),
  feedback_type
order by
  day desc,
  feedback_type;
