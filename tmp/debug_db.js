const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://upgdrlotzruvbneodrqj.supabase.co';
const supabaseKey = 'sb_publishable_qYY3JwR_bTMBwzzZRvEvHw_aOO0DTXd'; 
const supabase = createClient(supabaseUrl, supabaseKey);
async function check() {
  const { data, error } = await supabase.from('restaurants').select('id').limit(1);
  if (error) console.error('Error:', error);
  else console.log('Found:', data);
}
check();
