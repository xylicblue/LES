import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const SUPABASE_URL = "https://sfrabtflrzvnrcxgnklm.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmcmFidGZscnp2bnJjeGdua2xtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxMzU4NSwiZXhwIjoyMDc4MDg5NTg1fQ.MTgsGt4c7Wvh9RXMO7JPOU6XERTZ0Xs1MKlhQn0W7nQ"; 

// The Single User Data
const scUser = {
  email: "sc-001@investo.local",
  password: "SC-938271", // Generated random password
  data: {
    team_name: "SC-001",
    role: "sc"
  }
};

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSCUser() {
  console.log(`Creating user: ${scUser.email}...`);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: scUser.email,
    password: scUser.password,
    user_metadata: scUser.data,
    email_confirm: true 
  });

  if (error) {
    console.error(`Error:`, error.message);
  } else {
    console.log(`✅ Success! Created SC-001 with ID: ${data.user.id}`);
  }
}

createSCUser();