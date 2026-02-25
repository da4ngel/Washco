import client, { setToken, clearToken } from './client';

export const login = async (identifier, password) => {
    const { data } = await client.post('/auth/login', { identifier, password });
    setToken(data.data.accessToken);
    return data.data;
};

export const register = async ({ email, password, fullName, phone, role }) => {
    const payload = { email, password, fullName, role };
    if (phone && phone.trim()) {
        payload.phone = phone;
    }
    const { data } = await client.post('/auth/register', payload);
    return data.data;
};

export const logout = async () => {
    try {
        await client.post('/auth/logout');
    } finally {
        clearToken();
    }
};

export const refreshToken = async () => {
    const { data } = await client.post('/auth/refresh');
    setToken(data.data.accessToken);
    return data.data;
};

export const getProfile = async () => {
    const { data } = await client.get('/auth/profile');
    return data.data;
};

export const updateProfile = async (updates) => {
    const { data } = await client.patch('/auth/profile', updates);
    return data.data;
};

export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await client.post('/auth/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
    const { data } = await client.post('/auth/change-password', { currentPassword, newPassword });
    return data;
};

export const googleLogin = async (idToken) => {
    const { data } = await client.post('/auth/google', { idToken });
    setToken(data.data.accessToken);
    return data.data;
};
