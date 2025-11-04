import * as vscode from 'vscode';
import { AuthService } from '../services/authService';

const purple = '#6A5ACD';
const purpleDark = '#483D8B';
const bgLight = '#F4F4F4';

export function openAuthPanel(
  context: vscode.ExtensionContext,
  onSubmit: (action: 'login' | 'signup', payload: { email: string; password: string }) => Promise<void>,
  auth: AuthService
) {
  const panel = vscode.window.createWebviewPanel(
    'authratorAuth',
    'Authrator Authentication',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')],
    }
  );

  const logo = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'media', 'icon.png')
  );

  const getHtml = (mode: 'login' | 'signup') => `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${panel.webview.cspSource} https:; style-src 'unsafe-inline' ${panel.webview.cspSource}; script-src 'unsafe-inline' ${panel.webview.cspSource};" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Authrator</title>
<style>
  body { background:${bgLight}; font-family: -apple-system, Segoe UI, Roboto, Inter, sans-serif; margin:0; padding:24px; }
  .card { max-width:420px; margin:0 auto; background:#fff; border-radius:14px; box-shadow:0 10px 30px rgba(106,90,205,0.15); padding:22px; }
  .logo { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
  .logo h1 { margin:0; font-size:18px; color:${purpleDark}; }
  .tabs { display:flex; gap:6px; margin:10px 0 18px; }
  .tab { flex:1; text-align:center; padding:8px 10px; border:2px solid ${purple}; border-radius:10px; color:${purpleDark}; cursor:pointer; user-select:none; }
  .tab.active { background:${purple}; color:#fff; }
  label { display:block; margin:10px 0 6px; font-weight:600; color:#333; }
  input { width:100%; padding:10px 12px; border:2px solid #ddd; border-radius:10px; outline:none; }
  input:focus { border-color:${purple}; }
  button { width:100%; margin-top:14px; background:${purple}; color:#fff; border:none; padding:10px 12px; border-radius:10px; font-weight:700; cursor:pointer; }
  .error { margin-top:10px; color:#b00020; font-size:12px; }
  .note { font-size:12px; color:#555; margin-top:6px; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <img src="${logo}" alt="Authrator" width="24" height="24" />
      <h1>Authrator</h1>
    </div>
    <div class="tabs">
      <div class="tab ${mode === 'login' ? 'active' : ''}" id="tab-login">Login</div>
      <div class="tab ${mode === 'signup' ? 'active' : ''}" id="tab-signup">Sign Up</div>
    </div>
    <form id="form">
      <label>Email</label>
      <input id="email" type="email" placeholder="you@example.com" required />
      <label>Password</label>
      <input id="password" type="password" placeholder="••••••••" required />
      <button id="submit">${mode === 'login' ? 'Login' : 'Sign Up'}</button>
      <div class="note">Data is stored locally when not logged in. Login to sync via proxy.</div>
      <div id="error" class="error" style="display:none"></div>
    </form>
  </div>
<script>
  const vscode = acquireVsCodeApi();
  let mode = '${mode}';
  const form = document.getElementById('form');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const err = document.getElementById('error');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  tabLogin.onclick = () => { mode='login'; vscode.postMessage({ action:'switch', mode }); };
  tabSignup.onclick = () => { mode='signup'; vscode.postMessage({ action:'switch', mode }); };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    err.style.display='none';
    vscode.postMessage({ action: mode, payload: { email: email.value, password: password.value } });
  });

  window.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.type === 'error') { err.textContent = m.message || 'Operation failed'; err.style.display='block'; }
  });
</script>
</body>
</html>`;

  const setMode = (m: 'login' | 'signup') => {
    panel.webview.html = getHtml(m);
  };

  setMode('login');

  panel.webview.onDidReceiveMessage(async (message) => {
    try {
      if (message.action === 'switch') {
        setMode(message.mode === 'signup' ? 'signup' : 'login');
        return;
      }

      if (message.action === 'login' || message.action === 'signup') {
        await onSubmit(message.action, message.payload);
        vscode.window.showInformationMessage(`Authrator: ${message.action} successful`);
        panel.dispose();
      }
    } catch (e: any) {
      panel.webview.postMessage({ type: 'error', message: e?.message || 'Authentication failed' });
    }
  });
}
