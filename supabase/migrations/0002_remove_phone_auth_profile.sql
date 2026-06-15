-- Remove phone OTP support from the application profile model.
-- Supabase Auth provider settings must also have Phone disabled in the dashboard.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

alter table public.profiles drop column if exists phone;
