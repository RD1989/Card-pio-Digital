-- Dashbord Stats RPC
CREATE OR REPLACE FUNCTION public.get_restaurant_stats(_restaurant_user_id uuid, _today_start timestamptz)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_orders', (SELECT count(*) FROM public.orders WHERE restaurant_user_id = _restaurant_user_id),
    'total_revenue', (SELECT coalesce(sum(total), 0) FROM public.orders WHERE restaurant_user_id = _restaurant_user_id),
    'today_orders', (SELECT count(*) FROM public.orders WHERE restaurant_user_id = _restaurant_user_id AND created_at >= _today_start),
    'today_revenue', (SELECT coalesce(sum(total) , 0) FROM public.orders WHERE restaurant_user_id = _restaurant_user_id AND created_at >= _today_start),
    'today_views', (SELECT count(*) FROM public.menu_views WHERE restaurant_user_id = _restaurant_user_id AND viewed_at >= _today_start),
    'total_products', (SELECT count(*) FROM public.products WHERE user_id = _restaurant_user_id OR restaurant_id = _restaurant_user_id),
    'active_products', (SELECT count(*) FROM public.products WHERE (user_id = _restaurant_user_id OR restaurant_id = _restaurant_user_id) AND is_active = true)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Analytics Daily Metrics RPC
CREATE OR REPLACE FUNCTION public.get_daily_metrics(_restaurant_user_id uuid, _days integer DEFAULT 30)
RETURNS TABLE (metric_date date, views bigint, orders bigint, revenue numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH dates AS (
    SELECT (current_date - (i * interval '1 day'))::date AS d
    FROM generate_series(0, _days - 1) AS i
  ),
  v AS (
    SELECT viewed_at::date as d, count(*) as count
    FROM public.menu_views
    WHERE restaurant_user_id = _restaurant_user_id
      AND viewed_at >= (current_date - (_days - 1) * interval '1 day')
    GROUP BY 1
  ),
  o AS (
    SELECT created_at::date as d, count(*) as count, sum(total) as revenue
    FROM public.orders
    WHERE restaurant_user_id = _restaurant_user_id
      AND created_at >= (current_date - (_days - 1) * interval '1 day')
    GROUP BY 1
  )
  SELECT 
    dates.d as metric_date,
    coalesce(v.count, 0) as views,
    coalesce(o.count, 0) as orders,
    coalesce(o.revenue, 0) as revenue
  FROM dates
  LEFT JOIN v ON v.d = dates.d
  LEFT JOIN o ON o.d = dates.d
  ORDER BY 1 ASC;
END;
$$;
