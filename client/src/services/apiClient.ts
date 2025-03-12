import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:3000/api' : 'https://buildings-of-berlin-be.netlify.app/api',
});

export default apiClient;