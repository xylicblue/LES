import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, 'special_users.json');

// Configuration for the new roles
const ROLES_CONFIG = [
  { prefix: 'events', count: 5, role: 'events' }, // events-001 to events-005
  { prefix: 'fnr', count: 5, role: 'fnr' },       // fnr-001 to fnr-005
  { prefix: 'dc', count: 20, role: 'dc' }         // dc-001 to dc-020
];

const EMAIL_DOMAIN = 'investo.local';

const users = [];

console.log('Generating credentials...');

ROLES_CONFIG.forEach((config) => {
  for (let i = 1; i <= config.count; i++) {
    // Format number to be 001, 002, etc.
    const numStr = i.toString().padStart(3, '0');
    const username = `${config.prefix}-${numStr}`;
    
    let password = '';

    // Set passwords based on role
    if (config.role === 'events') {
      password = 'EventsAdmin2025!';
    } else if (config.role === 'fnr') {
      password = 'FinanceAdmin2025!';
    } else if (config.role === 'dc') {
      // Generate a random 6-digit number
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      password = `DC-${randomNum}`;
    }

    users.push({
      email: `${username}@${EMAIL_DOMAIN}`,
      password: password,
      data: {
        team_name: username.toUpperCase(), // Display Name (e.g., DC-001)
        role: config.role
      }
    });
  }
});

// Write to JSON file
fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

console.log(`Successfully generated ${users.length} credentials.`);
console.log(`File saved to: ${USERS_FILE}`);
console.log('------------------------------------------------');
console.log('Sample DC Credential:');
// Find a DC user to show as sample
const dcUser = users.find(u => u.data.role === 'dc');
if (dcUser) console.log(dcUser);