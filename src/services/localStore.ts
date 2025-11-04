import * as vscode from 'vscode';
import { TextEncoder } from 'util';

export interface LocalCollection {
  id: string;
  name: string;
  color?: string;
  apis: LocalApi[];
}

export interface LocalApi {
  id: string;
  name: string;
  method: string;
  url: string;
  headers?: any[];
  queryParams?: any[];
  body?: any;
  auth?: any;
}

export class LocalStore {
  private context: vscode.ExtensionContext;
  private fileName = 'collections.json';

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  private async readStore(): Promise<LocalCollection[]> {
    try {
      const fileUri = vscode.Uri.joinPath(this.context.globalStorageUri, this.fileName);
      const buf = await vscode.workspace.fs.readFile(fileUri);
      return JSON.parse(Buffer.from(buf).toString('utf8')) as LocalCollection[];
    } catch {
      return [];
    }
  }

  private async writeStore(data: LocalCollection[]): Promise<void> {
    const fileUri = vscode.Uri.joinPath(this.context.globalStorageUri, this.fileName);
    const enc = new TextEncoder();
    await vscode.workspace.fs.writeFile(fileUri, enc.encode(JSON.stringify(data, null, 2)));
  }

  async getCollections(): Promise<LocalCollection[]> {
    return this.readStore();
  }

  async createCollection(name: string, color: string): Promise<LocalCollection> {
    const collections = await this.readStore();
    const c: LocalCollection = { id: `local-${Date.now()}`, name, color, apis: [] };
    collections.push(c);
    await this.writeStore(collections);
    return c;
  }

  async createApi(collectionId: string, name: string, method: string, url: string): Promise<LocalApi> {
    const collections = await this.readStore();
    const c = collections.find(x => x.id === collectionId);
    if (!c) { throw new Error('Collection not found'); }
    const api: LocalApi = { id: `local-api-${Date.now()}`, name, method, url };
    c.apis.push(api);
    await this.writeStore(collections);
    return api;
  }

  async updateApi(api: any): Promise<void> {
    const collections = await this.readStore();
    let found = false;
    
    for (const collection of collections) {
      const apiIndex = collection.apis.findIndex(a => a.id === api.id);
      if (apiIndex !== -1) {
        collection.apis[apiIndex] = {
          ...collection.apis[apiIndex],
          name: api.name || collection.apis[apiIndex].name,
          method: api.method || collection.apis[apiIndex].method,
          url: api.url !== undefined ? api.url : collection.apis[apiIndex].url,
          headers: api.headers !== undefined ? api.headers : collection.apis[apiIndex].headers,
          queryParams: api.queryParams !== undefined ? api.queryParams : collection.apis[apiIndex].queryParams,
          body: api.body !== undefined ? api.body : collection.apis[apiIndex].body
        };
        found = true;
        break;
      }
    }
    
    if (found) {
      await this.writeStore(collections);
    }
  }

  async updateCollection(collectionId: string, name: string): Promise<void> {
    const collections = await this.readStore();
    const idx = collections.findIndex(c => c.id === collectionId);
    if (idx !== -1) {
      collections[idx] = { ...collections[idx], name: name || collections[idx].name };
      await this.writeStore(collections);
    }
  }

  async deleteCollection(collectionId: string): Promise<void> {
    const collections = await this.readStore();
    const filtered = collections.filter(c => c.id !== collectionId);
    await this.writeStore(filtered);
  }

  async deleteApi(apiId: string): Promise<void> {
    const collections = await this.readStore();
    let changed = false;
    collections.forEach(c => {
      const before = c.apis.length;
      c.apis = c.apis.filter(a => a.id !== apiId);
      if (c.apis.length !== before) changed = true;
    });
    if (changed) {
      await this.writeStore(collections);
    }
  }

  async moveApi(apiId: string, targetCollectionId: string): Promise<void> {
    const collections = await this.readStore();
    let movedApi: LocalApi | null = null;
    let sourceIndex = -1;
    // Remove from source
    for (const c of collections) {
      const idx = c.apis.findIndex(a => a.id === apiId);
      if (idx !== -1) {
        movedApi = c.apis[idx];
        c.apis.splice(idx, 1);
        sourceIndex = idx;
        break;
      }
    }
    if (!movedApi) return;
    // Add to target
    const target = collections.find(c => c.id === targetCollectionId);
    if (target) {
      target.apis.push(movedApi);
      await this.writeStore(collections);
    }
  }
}
