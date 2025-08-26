import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68a8ff98179e8fd073737ac1", 
  requiresAuth: true // Ensure authentication is required for all operations
});
