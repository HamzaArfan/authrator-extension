import axios from 'axios';

const API_BASE_URL = 'https://authrator.com/db-api/api';

export interface Collection {
  id: string;
  name: string;
  color?: string;
  apis: Api[];
  subfolders?: any[];
}

export interface Api {
  id: string;
  name: string;
  method: string;
  url: string;
  headers?: any[];
  queryParams?: any[];
  body?: any;
  auth?: any;
  collectionId?: string;
}

export class ApiService {
  async getCollections(userId: string): Promise<Collection[]> {
    const res = await axios.get(`${API_BASE_URL}/collections/${userId}`);
    if (res.data?.success) {
      return (res.data.collections || []).map((c: any) => ({
        id: c._id || c.id,
        name: c.name,
        color: c.color || '#6A5ACD',
        apis: (c.apis || []).map((a: any) => ({
          id: a._id || a.id,
          name: a.name,
          method: a.method || 'GET',
          url: a.url || ''
        }))
      }));
    }
    throw new Error('Failed to load collections');
  }

  async createCollection(name: string, color: string, userId: string): Promise<Collection> {
    const res = await axios.post(`${API_BASE_URL}/collections`, { name, color, userId });
    if (res.data?.success) {
      const c = res.data.collection;
      return { id: c._id || c.id, name: c.name, color: c.color, apis: [], subfolders: [] };
    }
    throw new Error('Failed to create collection');
  }

  async createApi(collectionId: string, name: string, method: string, url: string): Promise<Api> {
    const res = await axios.post(`${API_BASE_URL}/apis`, { collectionId, name, method });
    if (res.data?.success) {
      const apiId = res.data.api._id || res.data.api.id;
      // update full details
      await axios.put(`${API_BASE_URL}/apis/${apiId}`, {
        url,
        headers: [],
        queryParams: [],
        body: { type: 'none', content: '' },
        auth: { type: 'none' },
        scripts: { preRequest: '', tests: '' }
      });
      return { id: apiId, name, method, url };
    }
    throw new Error('Failed to create API');
  }

  async updateApi(api: Api): Promise<void> {
    await axios.put(`${API_BASE_URL}/apis/${api.id}`, {
      name: api.name,
      method: api.method,
      url: api.url,
      headers: api.headers || [],
      queryParams: api.queryParams || [],
      body: typeof api.body === 'string' ? { type: 'raw', content: api.body } : api.body || { type: 'none' },
      auth: api.auth || { type: 'none' },
      // support moving API between collections when provided
      ...(api as any).collectionId ? { collectionId: (api as any).collectionId } : {}
    });
  }

  async getApi(apiId: string): Promise<Api | null> {
    const res = await axios.get(`${API_BASE_URL}/apis/${apiId}`);
    if (res.data?.success && res.data.api) {
      const a = res.data.api;
      return {
        id: a._id || a.id,
        name: a.name,
        method: a.method || 'GET',
        url: a.url || '',
        headers: a.headers || [],
        queryParams: a.queryParams || [],
        body: a.body || { type: 'none' },
        auth: a.auth || { type: 'none' }
      };
    }
    return null;
  }

  async deleteApi(apiId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/apis/${apiId}`);
  }

  async updateCollection(collectionId: string, name: string, color: string): Promise<void> {
    await axios.put(`${API_BASE_URL}/collections/${collectionId}`, { name });
  }

  async renameCollection(collectionId: string, newName: string, color?: string): Promise<void> {
    await axios.put(`${API_BASE_URL}/collections/${collectionId}/rename`, { newName, color });
  }

  async deleteCollection(collectionId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/collections/${collectionId}`);
  }

  async sendRequest(api: Api): Promise<any> {
    // Build query params
    let finalUrl = api.url || '';
    if (api.queryParams && api.queryParams.length > 0) {
      const params = api.queryParams
        .filter(p => p.key)
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || '')}`);
      if (params.length > 0) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + params.join('&');
      }
    }

    // Build headers
    const headers: Record<string, string> = {};
    if (Array.isArray(api.headers)) {
      api.headers.forEach(h => {
        const key = (h?.key || '').trim();
        const val = (h?.value || '').trim();
        if (key) headers[key] = val;
      });
    }
    const hasHeaderKey = (k: string) => Object.keys(headers).some(hk => hk.toLowerCase() === String(k || '').toLowerCase());
    const hasAuthHeader = hasHeaderKey('authorization');

    // Inject Authorization / API Key similar to web app
    if (api.auth && api.auth.type && api.auth.type !== 'none') {
      switch (api.auth.type) {
        case 'basic': {
          const username = api.auth.username;
          if (username && !hasAuthHeader) {
            const encoded = Buffer.from(`${username}:${api.auth.password || ''}`).toString('base64');
            headers['Authorization'] = `Basic ${encoded}`;
          }
          break;
        }
        case 'bearer': {
          const token = api.auth.token;
          if (token && !hasAuthHeader) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          break;
        }
        case 'api-key': {
          const key = api.auth.apiKey?.key;
          const value = api.auth.apiKey?.value;
          const addTo = api.auth.apiKey?.addTo || 'header';
          if (key && value) {
            if (addTo === 'header' && !hasHeaderKey(key)) {
              headers[key] = value;
            } else if (addTo === 'query') {
              // Add to query string
              const qp = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
              finalUrl += (finalUrl.includes('?') ? '&' : '?') + qp;
            }
          }
          break;
        }
      }
    }

    // Ensure default headers are present (do not override user-provided)
    const DEFAULT_HEADERS = [
      { key: 'User-Agent', value: 'Authrator-Client' },
      { key: 'Cache-Control', value: 'no-cache' },
      { key: 'Connection', value: 'keep-alive' }
    ];
    DEFAULT_HEADERS.forEach(h => {
      if (!hasHeaderKey(h.key)) headers[h.key] = h.value;
    });

    // Prepare body
    let body: any = null;
    let bodyType: 'none' | 'raw' | 'formData' | 'urlencoded' = 'none';
    if (api.method !== 'GET' && api.method !== 'HEAD') {
      if (typeof api.body === 'string') {
        bodyType = 'raw';
        body = api.body;
        if (!hasHeaderKey('content-type')) {
          headers['Content-Type'] = 'application/json';
        }
      } else if (api.body && typeof api.body === 'object') {
        const type = (api.body.type as any) || 'none';
        bodyType = type;
        if (type === 'raw') {
          body = { type: 'raw', content: api.body.content || '' };
          if (!hasHeaderKey('content-type')) {
            headers['Content-Type'] = 'application/json';
          }
        } else if (type === 'formData') {
          // Do not set Content-Type; boundary is set by sender
          body = {
            type: 'formData',
            formData: Array.isArray(api.body.formData) ? api.body.formData.map((i: any) => ({ key: i.key, value: i.value, type: i.type })) : []
          };
        } else if (type === 'urlencoded') {
          if (!hasHeaderKey('content-type')) {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
          }
          body = {
            type: 'urlencoded',
            urlencoded: Array.isArray(api.body.urlencoded) ? api.body.urlencoded.map((i: any) => ({ key: i.key, value: i.value })) : []
          };
        } else {
          bodyType = 'none';
          body = null;
        }
      }
    }

    // Send through proxy server
    const proxyRequest = {
      method: api.method,
      url: finalUrl,
      headers: Object.keys(headers).map(k => ({ key: k, value: headers[k] })),
      bodyType: bodyType,
      body: body,
      settings: {
        followRedirects: true,
        timeout: 30000,
        sslVerification: true
      }
    };

    const response = await axios.post('https://authrator.com/api/api/proxy', proxyRequest);
    return response;
  }
}
