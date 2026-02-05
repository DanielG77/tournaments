import api from './api';

// ---- TOURNAMENTS ----
export const adminTournamentsAPI = {
    list: (skip = 0, limit = 50) =>
        api.get('/admin/tournaments').then(r => r.data),

    get: (id) =>
        api.get(`/admin/tournaments/${id}`).then(r => r.data),

    create: (data) =>
        api.post('/admin/tournaments', data).then(r => r.data),

    update: (id, data) =>
        api.put(`/admin/tournaments/${id}`, data).then(r => r.data),

    delete: (id) =>
        api.delete(`/admin/tournaments/${id}`)
};

// ---- TEAMS ----
export const adminTeamsAPI = {
    list: async () => {
        const res = await api.get('/admin/teams/');
        return res.data;
    },
    getTeam: async (teamId) => {
        const res = await api.get(`/admin/teams/${teamId}`);
        return res.data;
    },
    addMember: async (teamId, userId, role = 'member') => {
        const res = await api.post(`/admin/teams/${teamId}/members`, { user_id_to_add: userId, role });
        return res.data;
    },
    removeMember: async (teamId, userId) => {
        await api.delete(`/admin/teams/${teamId}/members/${userId}`);
    },
    updateMemberStatus: async (teamId, userId, status) => {
        const res = await api.put(`/admin/teams/${teamId}/members/${userId}/status`, { status });
        return res.data;
    },

    get: (id) =>
        api.get(`/admin/teams/${id}`).then(r => r.data),

    update: (id, data) =>
        api.put(`/admin/teams/${id}`, data).then(r => r.data),

    deactivate: (id) =>
        api.delete(`/admin/teams/${id}`),

};

// ---- REGISTRATIONS ----
export const adminRegistrationsAPI = {
    list: (status, skip = 0, limit = 50) =>
        api.get('/admin/registrations/').then(r => r.data),

    review: (participantId, payload) =>
        api.put(`/admin/registrations/${participantId}/review`, payload).then(r => r.data),

    changeStatus: (participantId, payload) =>
        api.put(`/admin/registrations/participants/${participantId}/status`, payload).then(r => r.data)
};

// ---- PLAYERS ----
export const adminPlayersAPI = {
    list: (skip = 0, limit = 50) =>
        api.get('/admin/players/').then(r => r.data),

    get: (id) =>
        api.get(`/admin/players/${id}`).then(r => r.data),

    // ⚡ Solo para actualizar la contraseña
    updatePassword: (id, data) =>
        api.put(`/admin/players/${id}/password`, data).then(r => {
            // El backend devuelve 204 No Content, por eso retornamos null
            if (r.status === 204) return null;
            return r.data;
        })
};
