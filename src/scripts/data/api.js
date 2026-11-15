import CONFIG from '../config.js';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  DATA: `${CONFIG.BASE_URL}/stories`,
};

const STORAGE_USERS_KEY = 'MOCK_REGISTERED_USERS';

export async function register({ name, email, password }) {
  const isRealApi =
    typeof CONFIG.BASE_URL === 'string' && CONFIG.BASE_URL.startsWith('http');

  if (isRealApi) {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const responseJson = await response.json();
    if (!response.ok || responseJson.error) {
      throw new Error(
        responseJson.message || 'Pendaftaran gagal. Silakan coba lagi.'
      );
    }

    return responseJson;
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name || !email || !password) {
    throw new Error('Semua data (nama, email, password) wajib diisi.');
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Format email tidak valid. Masukkan format email yang benar (contoh: nama@email.com).');
  }

  const storedUsers = JSON.parse(
    localStorage.getItem(STORAGE_USERS_KEY) || '[]'
  );

  const isAlreadyRegistered = storedUsers.some(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );

  if (isAlreadyRegistered) {
    throw new Error(
      'Email ini sudah terdaftar. Silakan gunakan email lain atau langsung login.'
    );
  }

  storedUsers.push({
    name: name.trim(),
    email: email.trim(),
    password,
  });

  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(storedUsers));

  return {
    error: false,
    message: 'Registrasi berhasil! Data akun telah tersimpan di localStorage.',
  };
}

export async function login({ email, password }) {
  const isRealApi =
    typeof CONFIG.BASE_URL === 'string' && CONFIG.BASE_URL.startsWith('http');

  if (isRealApi) {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseJson = await response.json();
    if (!response.ok || responseJson.error) {
      throw new Error(
        responseJson.message || 'Login gagal. Periksa kembali email dan password.'
      );
    }

    const token = responseJson.loginResult?.token || responseJson.token;
    const user = responseJson.loginResult || responseJson.user || { email };

    return {
      error: false,
      message: responseJson.message || 'Login berhasil!',
      token,
      user,
    };
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !password) {
    throw new Error('Email dan password wajib diisi.');
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Format email tidak valid. Masukkan format email yang benar (contoh: nama@email.com).');
  }

  const storedUsers = JSON.parse(
    localStorage.getItem(STORAGE_USERS_KEY) || '[]'
  );

  const matchedUser = storedUsers.find(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase()
  );

  if (!matchedUser) {
    throw new Error(
      'Akun belum terdaftar. Silakan lakukan registrasi terlebih dahulu.'
    );
  }

  if (matchedUser.password !== password) {
    throw new Error(
      'Password salah. Silakan periksa kembali password yang Anda daftarkan.'
    );
  }

  const mockToken = `token_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  return {
    error: false,
    message: 'Login berhasil!',
    token: mockToken,
    user: {
      name: matchedUser.name,
      email: matchedUser.email,
    },
  };
}

export async function getData() {
  const isRealApi =
    typeof CONFIG.BASE_URL === 'string' && CONFIG.BASE_URL.startsWith('http');

  if (isRealApi) {
    const token = localStorage.getItem('AUTH_ACCESS_TOKEN');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(ENDPOINTS.DATA, { headers });
    const responseJson = await response.json();

    if (!response.ok || responseJson.error) {
      throw new Error(responseJson.message || 'Gagal memuat data dari API.');
    }

    return responseJson.listStory || responseJson.data || [];
  }

  return [];
}
