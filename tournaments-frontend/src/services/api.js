import axios from 'axios';

// Configura la URL base de tu API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para manejar errores
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.status, error.message);
        return Promise.reject(error);
    }
);

export const tournamentAPI = {
    getAll: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tournaments`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();

            return data.map(tournament => ({
                ...tournament,
                images: tournament.images ? JSON.parse(tournament.images) : []
            }));
        } catch (error) {
            console.error('Error fetching tournaments:', error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/tournaments/${id}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();

            return {
                ...data,
                images: data.images ? JSON.parse(data.images) : []
            };
        } catch (error) {
            console.error(`Error fetching tournament ${id}:`, error);
            throw error;
        }
    },

    create: async (tournamentData) => {
        try {
            const response = await api.post('/tournaments', tournamentData);
            return response.data;
        } catch (error) {
            console.error('Error creating tournament:', error);
            throw error;
        }
    },

    update: async (id, tournamentData) => {
        try {
            const response = await api.put(`/tournaments/${id}`, tournamentData);
            return response.data;
        } catch (error) {
            console.error(`Error updating tournament ${id}:`, error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const response = await api.delete(`/tournaments/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting tournament ${id}:`, error);
            throw error;
        }
    },
};

export default api;