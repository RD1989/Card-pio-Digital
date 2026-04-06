-- Add trial and subscription fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN trial_ends_at timestamptz DEFAULT (now() + interval '30 days'),
  ADD COLUMN plan_status text NOT NULL DEFAULT 'trial';

-- Update handle_new_user to set trial automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, slug, restaurant_name, plan, plan_status, trial_ends_at)
  VALUES (
    NEW.id,
    REPLACE(LOWER(COALESCE(NEW.raw_user_meta_data->>'full_name', 'loja-' || LEFT(NEW.id::text, 8))), ' ', '-'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Minha Loja'),
    'basic',
    'trial',
    now() + interval '10 days'
  );
  RETURN NEW;
END;
$function$;

-- Function to count monthly orders for a restaurant
CREATE OR REPLACE FUNCTION public.count_monthly_orders(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM public.orders
  WHERE restaurant_user_id = _user_id
    AND created_at >= date_trunc('month', now())
$$;