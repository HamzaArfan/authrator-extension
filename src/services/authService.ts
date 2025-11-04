import * as vscode from 'vscode';
import axios from 'axios';

const API_BASE_URL = 'https://authrator.com/db-api/api';

export class AuthService {
  private context: vscode.ExtensionContext;
  private stateKey = 'authrator:user';

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  get isLoggedIn(): boolean {
    return !!this.user;
  }

  get user(): any | null {
    const val = this.context.globalState.get(this.stateKey) as string | undefined;
    if (!val) return null;
    try { return JSON.parse(val); } catch { return null; }
  }

  get userId(): string | null {
    return this.user?.id || this.user?._id || null;
  }

  async login(email: string, password: string) {
    const res = await axios.post(`${API_BASE_URL}/login`, { email, password });
    if (res.data?.success && res.data?.user) {
      await this.context.globalState.update(this.stateKey, JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error(res.data?.message || 'Login failed');
  }

  async signup(email: string, password: string) {
    const res = await axios.post(`${API_BASE_URL}/signup`, { email, password });
    if (res.data?.success && res.data?.user) {
      await this.context.globalState.update(this.stateKey, JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error(res.data?.message || 'Signup failed');
  }

  async logout() {
    await this.context.globalState.update(this.stateKey, undefined);
  }
}
