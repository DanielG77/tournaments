import api from './api';

// ---- TOURNAMENTS ----
export const adminTournamentsAPI = {
    list: (skip = 0, limit = 50) =>
        // api.get('/admin/tournaments/', { params: { skip, limit } }).then(r => r.data),
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
    list: (skip = 0, limit = 50) =>
        api.get('/admin/teams/').then(r => r.data),

    get: (id) =>
        api.get(`/admin/teams/${id}`).then(r => r.data),

    update: (id, data) =>
        api.put(`/admin/teams/${id}`, data).then(r => r.data),

    deactivate: (id) =>
        api.delete(`/admin/teams/${id}`),

    addMember: (teamId, userId, role = 'member') =>
        api.post(`/admin/teams/${teamId}/members`, null, {
            params: { user_id_to_add: userId, role }
        }),

    removeMember: (teamId, memberId) =>
        api.delete(`/admin/teams/${teamId}/members/${memberId}`)
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
        api.get(`/admin/players/${id}`).then(r => r.data)
};
