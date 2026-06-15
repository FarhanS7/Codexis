import axios from 'axios';

// One instance shared by every hook and component in the frontend.
// Benefits:
//   1. withCredentials: true set once → JWT cookie included on every request
//   2. baseURL set once → all hooks use relative paths like '/github/repos'
//   3. Interceptors set once → 401 handling applies globally
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true, // Send JWT cookie on every cross-origin request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor: Global 401 Handler
// If any request returns 401, the JWT has expired or was cleared.
// Redirect to /login so the user re-authenticates.
api.interceptors.response.use(
  (response) => response, // Pass through successful responses unchanged
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    // Always re-reject so callers can still handle the error themselves
    return Promise.reject(error);
  },
);

export default api;
