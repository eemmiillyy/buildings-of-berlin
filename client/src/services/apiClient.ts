import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://buildings-of-berlin-be.netlify.app/api' 
    : 'http://localhost:3000/api',
});

export default apiClient;