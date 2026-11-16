const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'recycleflow_admin_token';

export const getAdminToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setAdminToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);
export const clearAdminToken = () => sessionStorage.removeItem(TOKEN_KEY);

export async function lookupCep(cep, signal) {
  const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, { signal });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message ?? 'Não foi possível localizar esse CEP.');
  }
  return data;
}

async function request(path, { method = 'GET', body, token = getAdminToken() } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401 || response.status === 403) clearAdminToken();
  if (!response.ok) {
    const data = await response.json();
    const detail = Array.isArray(data.detail)
      ? data.detail
        .map(({ loc, msg }) => `${Array.isArray(loc) ? loc.slice(1).join('.') : 'Campo'}: ${msg}`)
        .join('; ')
      : data.detail;
    throw new Error(detail ?? `Erro ${response.status} ao acessar a API`);
  }
  return response.status === 204 ? null : response.json();
}

export const loginAdmin = (email, senha) =>
  request('/admin/login', { method: 'POST', body: { email, senha }, token: null });
export const getAdminSession = () => request('/admin/sessao');
export const getAdminOptions = () => request('/admin/opcoes');
export const listAdminResource = (resource) => request(`/admin/${resource}`);
export const saveAdminResource = (resource, id, body) =>
  request(`/admin/${resource}${id == null ? '' : `/${id}`}`, {
    method: id == null ? 'POST' : 'PUT',
    body,
  });
export const deleteAdminResource = (resource, id) =>
  request(`/admin/${resource}/${id}`, { method: 'DELETE' });
