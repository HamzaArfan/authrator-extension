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
        color: c.color || '#FF6B6B',
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
    if (api.headers) {
      api.headers.forEach(h => {
        if (h.key) headers[h.key] = h.value || '';
      });
    }

    // Prepare body
    let body = null;
    if (api.method !== 'GET' && api.method !== 'HEAD') {
      if (typeof api.body === 'string') {
        body = api.body;
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      } else if (api.body && api.body.content) {
        body = api.body.content;
      }
    }

    // Send through proxy server
    const proxyRequest = {
      method: api.method,
      url: finalUrl,
      headers: Object.keys(headers).map(k => ({ key: k, value: headers[k] })),
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
