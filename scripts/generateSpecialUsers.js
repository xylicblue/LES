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
  { prefix: 'fnr', count: 5, role: 'fnr' },       // fnr-001 to fnr-005 (Finance & Reg)
  { prefix: 'dc', count: 20, role: 'dc' }         // dc-001 to dc-020 (Discipline Committee)
];

const DEFAULT_PASSWORD = 'Investo2025!'; // You can change this
const EMAIL_DOMAIN = 'investo.local';

const users = [];

console.log('Generating credentials...');

ROLES_CONFIG.forEach((config) => {
  for (let i = 1; i <= config.count; i++) {
    // Format number to be 001, 002, etc.
    const numStr = i.toString().padStart(3, '0');
    const username = `${config.prefix}-${numStr}`;
    
    users.push({
      email: `${username}@${EMAIL_DOMAIN}`,
      password: DEFAULT_PASSWORD,
      data: {
        team_name: username.toUpperCase(), // Display Name (e.g., EVENTS-001)
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
console.log('Sample Credentials:');
console.log(users[0]); // Print first one as sanity check