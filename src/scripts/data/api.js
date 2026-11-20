import CONFIG from '../config.js';

const ENDPOINTS = {
  DATA: `${CONFIG.BASE_URL}/stories`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
};

const STORAGE_USERS_KEY = 'MOCK_REGISTERED_USERS';
const STORY_API_TOKEN_KEY = 'STORY_API_GUEST_TOKEN';

const DEFAULT_STORY_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLUtnaTNGcF90SFhFeDdWQ2kiLCJpYXQiOjE3OTUwNzMyMjV9.pwyfQi4ooNWchSwcCFf5SP7e0YEhxH4sAgNj0KCHzHg';


export async function register({ name, email, password }) {
  await new Promise((resolve) => setTimeout(resolve, 400));

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
  await new Promise((resolve) => setTimeout(resolve, 400));

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

async function getStoryApiToken() {
  const cachedToken = localStorage.getItem(STORY_API_TOKEN_KEY);
  if (cachedToken) {
    return cachedToken;
  }

  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dicoding_guest_app@gmail.com',
        password: 'password123',
      }),
    });

    const responseJson = await response.json();
    const token = responseJson.loginResult?.token || responseJson.token;
    if (token) {
      localStorage.setItem(STORY_API_TOKEN_KEY, token);
      return token;
    }
  } catch (err) {
    console.warn('Gagal login guest ke Story API, menggunakan default token:', err.message);
  }

  return DEFAULT_STORY_TOKEN;
}

export async function getData({ location = 1 } = {}) {
  const token = await getStoryApiToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = new URL(ENDPOINTS.DATA);
  if (location !== undefined) {
    url.searchParams.set('location', String(location));
  }

  const response = await fetch(url.toString(), { headers });
  const responseJson = await response.json();

  if (!response.ok || responseJson.error) {
    throw new Error(responseJson.message || 'Gagal memuat data dari API.');
  }

  return responseJson.listStory || responseJson.data || [];
}

export async function addStory({ description, photo, lat, lon }) {
  if (!description || !description.trim()) {
    throw new Error('Deskripsi cerita wajib diisi.');
  }

  if (!photo) {
    throw new Error('Foto cerita wajib disertakan (pilih file atau ambil dari kamera).');
  }

  const formData = new FormData();
  formData.append('description', description.trim());
  formData.append('photo', photo);

  if (lat !== undefined && lat !== null && lat !== '') {
    formData.append('lat', String(lat));
  }
  if (lon !== undefined && lon !== null && lon !== '') {
    formData.append('lon', String(lon));
  }

  const userToken = localStorage.getItem('AUTH_ACCESS_TOKEN');
  let token = (userToken && userToken.startsWith('ey')) ? userToken : await getStoryApiToken();

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(ENDPOINTS.DATA, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (netError) {
    throw new Error(`Gagal menghubungi server API: ${netError.message || 'Koneksi terputus.'}`);
  }

  if (response.status === 401) {
    try {
      response = await fetch(`${CONFIG.BASE_URL}/stories/guest`, {
        method: 'POST',
        body: formData,
      });
    } catch {
      // Biarkan respons awal diproses
    }
  }

  let responseJson;
  try {
    responseJson = await response.json();
  } catch {
    throw new Error(`Server memberikan respons tidak valid (HTTP ${response.status}).`);
  }

  if (!response.ok || responseJson.error) {
    throw new Error(responseJson.message || 'Gagal menambahkan cerita baru ke server.');
  }

  return responseJson;
}

