import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- START CONFIGURATION ---

// !! USE YOUR SERVICE ROLE KEY, NOT THE ANON KEY !!
const SUPABASE_URL = "https://sfrabtflrzvnrcxgnklm.supabase.co";
//
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmcmFidGZscnp2bnJjeGdua2xtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxMzU4NSwiZXhwIjoyMDc4MDg5NTg1fQ.MTgsGt4c7Wvh9RXMO7JPOU6XERTZ0Xs1MKlhQn0W7nQ"; 

// --- END CONFIGURATION ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the "Admin" client
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 1. CHANGE FILE PATH: Read 'special_users.json' instead of 'users.json'
const usersFilePath = path.join(__dirname, 'special_users.json');

async function createUsers() {
  try {
    const fileContent = fs.readFileSync(usersFilePath, 'utf8');
    
    // 2. CHANGE DATA STRUCTURE: The new file is a direct array, not { users: [...] }
    const users = JSON.parse(fileContent);

    console.log(`Starting to import ${users.length} special users...`);

    for (const user of users) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        // 3. PASS METADATA: Pass the 'data' object (contains team_name AND role)
        user_metadata: user.data, 
        email_confirm: true 
      });

      if (error) {
        console.error(`Error creating user ${user.email}:`, error.message);
      } else {
        console.log(`Successfully created: ${user.email} (Role: ${user.data.role})`);
      }
    }

    console.log('User import complete.');
    
  } catch (err) {
    console.error("Error reading file or importing:", err);
  }
}

createUsers();