import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://upgdrlotzruvbneodrqj.supabase.co';
const supabaseKey = 'sb_publishable_qYY3JwR_bTMBwzzZRvEvHw_aOO0DTXd';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const res = await supabase.auth.signUp({
    email: 'rodrigotechpro@gmail.com',
    password: 'AdminPassword123!',
  });
  console.log(JSON.stringify(res, null, 2));
}

createAdmin();
