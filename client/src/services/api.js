const API_BASE_URL = 'http://localhost:3001/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Teams API
export const teamsAPI = {
  getByCode: (teamCode) => apiCall(`/teams/code/${teamCode}`),
  create: (teamData) => apiCall('/teams', { method: 'POST', body: teamData }),
};

// Users API
export const usersAPI = {
  getByCode: (teamCode, userCode) => apiCall(`/users/code/${teamCode}/${userCode}`),
  getByTeam: (teamId) => apiCall(`/users?teamId=${teamId}`),
  create: (userData) => apiCall('/users', { method: 'POST', body: userData }),
};

// Songs API
export const songsAPI = {
  getAll: (teamId) => apiCall(teamId ? `/songs?teamId=${teamId}` : '/songs'),
  getById: (songId) => apiCall(`/songs/${songId}`),
  getByUser: (userId) => apiCall(`/songs/user/${userId}`),
  create: (songData) => apiCall('/songs', { method: 'POST', body: songData }),
};

// Sections API
export const sectionsAPI = {
  getBySong: (songId) => apiCall(`/sections?songId=${songId}`),
  getById: (sectionId) => apiCall(`/sections/${sectionId}`),
  create: (sectionData) => apiCall('/sections', { method: 'POST', body: sectionData }),
};

// Lyrics API
export const lyricsAPI = {
  getBySong: (songId) => apiCall(`/lyrics?songId=${songId}`),
  getBySection: (sectionId) => apiCall(`/lyrics?sectionId=${sectionId}`),
  getById: (lyricId) => apiCall(`/lyrics/${lyricId}`),
  create: (lyricData) => apiCall('/lyrics', { method: 'POST', body: lyricData }),
};

// Updates API
export const updatesAPI = {
  getBySong: (songId) => apiCall(`/updates?songId=${songId}`),
  getByUser: (userId, status) => {
    const query = status ? `?userId=${userId}&status=${status}` : `?userId=${userId}`;
    return apiCall(`/updates${query}`);
  },
  getById: (updateId) => apiCall(`/updates/${updateId}`),
  create: (updateData) => apiCall('/updates', { method: 'POST', body: updateData }),
  confirm: (updateId, userId) => apiCall(`/updates/${updateId}/confirm`, {
    method: 'POST',
    body: { userId },
  }),
  update: (updateId, updateData) => apiCall(`/updates/${updateId}`, {
    method: 'PUT',
    body: updateData,
  }),
};

// Comments API
export const commentsAPI = {
  getByUpdate: (updateId) => apiCall(`/comments?updateId=${updateId}`),
  getById: (commentId) => apiCall(`/comments/${commentId}`),
  create: (commentData) => apiCall('/comments', { method: 'POST', body: commentData }),
};

// Assignments API
export const assignmentsAPI = {
  getByUser: (userId) => apiCall(`/assignments?userId=${userId}`),
  getBySong: (songId) => apiCall(`/assignments?songId=${songId}`),
  create: (assignmentData) => apiCall('/assignments', { method: 'POST', body: assignmentData }),
};

// Simulate API
export const simulateAPI = {
  reassignChorus2: () => apiCall('/simulate/reassign-chorus2', { method: 'POST' }),
};

