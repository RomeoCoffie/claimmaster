import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const researchAPI = {
  startSpecificResearch: async (config) => {
    const response = await api.post('/research/specific', config);
    return response.data;
  },

  startDiscoverResearch: async (config) => {
    const response = await api.post('/research/discover', config);
    return response.data;
  },

  getInfluencerProfile: async (id) => {
    const response = await api.get(`/influencer/${id}`);
    return response.data;
  },

  getLeaderboard: async (category = 'all') => {
    const response = await api.get('/leaderboard', {
      params: { category }
    });
    return response.data;
  },

  verifyClaim: async (claim) => {
    const response = await api.post('/verifyClaim', claim);
    return response.data;
  },

  extractClaims: async (content) => {
    const response = await api.post('/extractClaims', { content });
    return response.data;
  }
};

export default api; 