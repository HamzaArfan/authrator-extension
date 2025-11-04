import * as vscode from 'vscode';
import { AuthService } from '../services/authService';
import { ApiService, Collection, Api } from '../services/apiService';
import { LocalStore, LocalCollection } from '../services/localStore';

const purple = '#8B5CF6';
const purpleDark = '#7C3AED';
const bgLight = '#FAFAFA';

export function openDashboardPanel(
  context: vscode.ExtensionContext,
  auth: AuthService,
  api: ApiService,
  local: LocalStore
) {
  const panel = vscode.window.createWebviewPanel(
    'authratorDashboard',
    'Authrator API Client',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')],
    }
  );

  const logo = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'icon.png'));

  const getState = async () => {
    let collections: Array<Collection | LocalCollection> = [];
    if (auth.isLoggedIn && auth.userId) {
      try { collections = await api.getCollections(auth.userId); } catch (e:any) { collections = []; }
    } else {
      collections = await local.getCollections();
    }
    return {
      isLoggedIn: auth.isLoggedIn,
      user: auth.user,
      collections
    };
  };

  const getHtml = () => `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${panel.webview.cspSource} https:; style-src 'unsafe-inline' ${panel.webview.cspSource}; script-src 'unsafe-inline' ${panel.webview.cspSource};" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Authrator API Client</title>
<style>
:root { 
  --purple: #8B5CF6; 
  --purpleDark: #7C3AED; 
  --bg: #FAFAFA; 
  --surface: #ffffff;
  --border: #E5E7EB;
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --hover-bg: #F3F4F6;
  --input-bg: #ffffff;
  --input-border: #D1D5DB;
}
[data-theme="dark"] {
  --bg: #09090b;
  --surface: #18181b;
  --border: #27272a;
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --hover-bg: #27272a;
  --input-bg: #18181b;
  --input-border: #3f3f46;
}
* { box-sizing: border-box; margin:0; padding:0; }
html, body { height: 100%; }
body { 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif; 
  background: var(--bg); 
  color: var(--text-primary);
  font-size: 13px;
}
.app { display:flex; flex-direction:column; height:100vh; }

/* Header */
.header { 
  height:52px; 
  background: var(--surface); 
  border-bottom:1px solid var(--border); 
  display:flex; 
  align-items:center; 
  justify-content:space-between; 
  padding:0 20px;
  flex-shrink: 0;
}
.brand { display:flex; align-items:center; gap:10px; font-weight:600; font-size:14px; }
.actions { display:flex; align-items:center; gap:10px; }

button { 
  background: var(--purple); 
  color:#fff; 
  border:none; 
  padding:7px 16px; 
  border-radius:6px; 
  font-weight:500; 
  cursor:pointer; 
  font-size:13px; 
  transition: all 0.15s ease;
  font-family: inherit;
}
button:hover { 
  background: var(--purpleDark);
}
button:active { opacity: 0.9; }

.btn-secondary { 
  background: var(--surface); 
  color: var(--text-primary); 
  border:1px solid var(--border);
}
.btn-secondary:hover { 
  background: var(--hover-bg);
}

.theme-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 7px;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.theme-btn:hover {
  background: var(--hover-bg);
}
.theme-btn svg {
  width: 18px;
  height: 18px;
  color: var(--text-primary);
}

/* Main Layout */
.main-content { 
  flex:1; 
  display:flex; 
  overflow:hidden;
  min-height: 0;
}

/* Left Sidebar */
.sidebar { 
  width: 280px; 
  background: var(--surface); 
  border-right: 1px solid var(--border); 
  display:flex; 
  flex-direction:column;
  flex-shrink: 0;
}
.sidebar-header { 
  padding:12px 16px; 
  border-bottom:1px solid var(--border); 
  font-weight:600;
  font-size:12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}
.search-box { padding:12px 16px; border-bottom:1px solid var(--border); }
.search-box input { 
  width:100%; 
  padding:8px 12px; 
  border:1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text-primary);
  border-radius:6px; 
  font-size:13px;
  transition: all 0.15s ease;
}
.search-box input:focus { 
  outline:none; 
  border-color:var(--purple);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
.search-box input::placeholder {
  color: var(--text-secondary);
}
.list { flex:1; overflow-y:auto; padding:8px; }

.collection { margin-bottom:4px; }
.collection-header { 
  display:flex; 
  align-items:center; 
  justify-content:space-between; 
  padding:8px 12px; 
  border-radius:6px; 
  cursor:pointer; 
  transition: background 0.15s ease;
}
.collection-header:hover { background: var(--hover-bg); }
.collection-name { display:flex; align-items:center; gap:8px; flex:1; font-size:13px; }
.collection-icon { width:18px; height:18px; flex-shrink:0; }
.collection-icon svg { width:100%; height:100%; }
.collection-actions { display:flex; gap:4px; opacity: 0; transition: opacity 0.15s ease; }
.collection-header:hover .collection-actions { opacity: 1; }
.icon-btn { 
  background:none; 
  border:none; 
  padding:4px 6px; 
  cursor:pointer; 
  color: var(--text-secondary); 
  display:flex; 
  align-items:center;
  border-radius:4px;
  font-size:16px;
}
.icon-btn:hover { 
  color:var(--purple); 
  background:rgba(139, 92, 246, 0.1);
}
.more-btn { 
  background:none; 
  border:none; 
  padding:4px; 
  cursor:pointer; 
  color: var(--text-secondary); 
  display:flex; 
  align-items:center;
  border-radius:4px;
  font-size:18px;
  line-height: 1;
  font-weight: 700;
}
.more-btn:hover { 
  color:var(--text-primary); 
  background:var(--hover-bg);
}
.dropdown-menu {
  position: absolute;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 4px;
  min-width: 160px;
  z-index: 1000;
  display: none;
}
.dropdown-menu.show {
  display: block;
}
.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  transition: background 0.15s ease;
}
.dropdown-item:hover {
  background: var(--hover-bg);
}
.dropdown-item.danger {
  color: #DC2626;
}
.dropdown-item.danger:hover {
  background: #FEE2E2;
}

.apis { margin:4px 0 0 20px; }
.api-item { 
  padding:6px 12px; 
  border-radius:6px; 
  cursor:pointer; 
  display:flex; 
  gap:8px; 
  align-items:center; 
  transition: background 0.15s ease;
  font-size:13px;
}
.api-item:hover { background: var(--hover-bg); }
.api-item.active { 
  background: rgba(139, 92, 246, 0.1); 
  color: var(--purple);
  font-weight: 500;
}
.api-item.active .method { 
  background: var(--purple); 
  color:#fff;
}
.api-item.unsaved {
  opacity: 0.7;
  font-style: italic;
}
.api-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.method { 
  font-size:10px; 
  font-weight:600; 
  padding:2px 6px; 
  border-radius:4px; 
  min-width:45px; 
  text-align:center;
}
.method.GET { background:#DBEAFE; color:#1E40AF; }
.method.POST { background:#D1FAE5; color:#065F46; }
.method.PUT { background:#FED7AA; color:#9A3412; }
.method.DELETE { background:#FEE2E2; color:#991B1B; }
.method.PATCH { background:#F3E8FF; color:#6B21A8; }
.method.HEAD { background:#E0E7FF; color:#3730A3; }
.method.OPTIONS { background:#FEF3C7; color:#92400E; }

/* Right Panel */
.right-panel { 
  flex:1; 
  display:flex; 
  flex-direction:column; 
  background: var(--bg);
  min-width: 0;
}
/* API Tabs Bar */
.api-tabs-bar {
  height: 40px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
}
.api-tabs { 
  display: flex; 
  align-items: stretch; 
  overflow-x: auto; 
  flex: 1; 
}
.api-tabs::-webkit-scrollbar { height: 6px; }
.api-tabs::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
.api-tab {
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 500;
  font-size: 13px;
  border-radius: 0;
  transition: color 0.15s ease, border-color 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}
.api-tab:hover { background: transparent; color: var(--text-primary); }
.api-tab.active { color: var(--purple); border-bottom-color: var(--purple); background: transparent; }
.api-tab .close { margin-left: 8px; color: var(--text-secondary); font-size: 12px; }
.api-tab .close:hover { color: var(--text-primary); }
.empty-state { 
  flex:1; 
  display:flex; 
  align-items:center; 
  justify-content:center; 
  flex-direction:column; 
  color: var(--text-secondary);
}
.empty-state svg { width:64px; height:64px; margin-bottom:16px; opacity:0.3; }

.api-editor { 
  flex:1; 
  display:flex; 
  flex-direction:column;
  min-height: 0;
}
.editor-header { 
  padding:16px 20px; 
  border-bottom:1px solid var(--border);
  flex-shrink: 0;
  background: var(--surface);
}
.url-bar { display:flex; gap:8px; margin-bottom:16px; }
.url-bar select { 
  padding:8px 12px; 
  border:1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text-primary);
  border-radius:6px; 
  font-weight:600; 
  cursor:pointer;
  font-size:13px;
  transition: all 0.15s ease;
}
.url-bar select:focus {
  outline:none;
  border-color:var(--purple);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
.url-bar input { 
  flex:1; 
  padding:8px 12px; 
  border:1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text-primary);
  border-radius:6px; 
  font-size:13px;
  transition: all 0.15s ease;
}
.url-bar input:focus { 
  outline:none; 
  border-color:var(--purple);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
.url-bar input::placeholder {
  color: var(--text-secondary);
}
.url-bar button { padding:8px 20px; flex-shrink: 0; }

.editor-tabs { 
  display:flex; 
  gap:0; 
  border-bottom:2px solid var(--border);
  background: var(--surface);
}
.editor-tab { 
  padding:12px 20px;
  background:none; 
  border:none; 
  border-bottom:2px solid transparent;
  margin-bottom: -2px;
  cursor:pointer; 
  font-weight:500;
  color: var(--text-secondary);
  font-size:13px;
  position: relative;
  border-radius: 0;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.editor-tab:hover { 
  color: var(--text-primary);
  background: transparent;
}
.editor-tab.active { 
  color: var(--purple);
  border-bottom-color: var(--purple);
  background: transparent;
}

.tab-content { 
  padding:20px; 
  overflow-y:auto;
  flex: 1;
  min-height: 0;
  background: var(--bg);
}
.param-row { 
  display:flex; 
  gap:8px; 
  margin-bottom:8px; 
  align-items:center;
}
.param-row input { 
  flex:1; 
  padding:8px 12px; 
  border:1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text-primary);
  border-radius:6px; 
  font-size:13px;
  transition: all 0.15s ease;
}
.param-row input:focus {
  outline:none;
  border-color:var(--purple);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
.param-row input::placeholder {
  color: var(--text-secondary);
}
.param-row button { 
  padding:8px 12px; 
  font-size:18px;
  line-height: 1;
}

.response-section { 
  border-top:1px solid var(--border); 
  display:flex; 
  flex-direction:column;
  flex-shrink: 0;
  height: 300px;
  background: var(--surface);
}
.response-header { 
  padding:12px 20px; 
  background: var(--hover-bg); 
  display:flex; 
  justify-content:space-between; 
  align-items:center; 
  font-weight:600;
  font-size:13px;
  border-bottom:1px solid var(--border);
}
.response-status {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}
.response-body { 
  flex:1; 
  overflow:auto;
  min-height: 0;
}
.response-editor { 
  height:100%;
  border:none;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace; 
  font-size:12px; 
  overflow:auto; 
  padding:16px 20px; 
  background: var(--bg);
  margin: 0;
  white-space: pre;
  color: var(--text-primary);
}

.loading { 
  padding:16px; 
  text-align:center; 
  color: var(--text-secondary);
  background: var(--hover-bg);
  border-top: 1px solid var(--border);
}

/* Auth Overlay */
.overlay { 
  position:fixed; 
  inset:0; 
  background:rgba(0,0,0,0.5); 
  display:none; 
  align-items:center; 
  justify-content:center; 
  z-index:999;
  backdrop-filter: blur(4px);
}
.modal { 
  width:420px; 
  background: var(--surface); 
  border-radius:12px; 
  padding:28px; 
  box-shadow:0 20px 60px rgba(0,0,0,0.3);
}
.modal h2 { 
  margin-bottom:20px; 
  color: var(--text-primary);
  font-size:20px;
}
.modal-tabs { 
  display:flex; 
  gap:8px; 
  margin-bottom:20px;
  background: var(--hover-bg);
  padding: 4px;
  border-radius: 8px;
}
.modal-tab { 
  flex:1; 
  text-align:center; 
  padding:8px; 
  border:none;
  border-radius:6px; 
  color: var(--text-secondary); 
  cursor:pointer; 
  user-select:none; 
  background:transparent; 
  font-weight:500;
  font-size:13px;
  transition: all 0.15s ease;
}
.modal-tab.active { 
  background: var(--surface); 
  color: var(--purple);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.modal input { 
  width:100%; 
  padding:10px 12px; 
  border:1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text-primary);
  border-radius:6px; 
  margin-bottom:12px; 
  font-size:14px;
  transition: all 0.15s ease;
}
.modal input:focus { 
  outline:none; 
  border-color:var(--purple);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
.modal input::placeholder {
  color: var(--text-secondary);
}
.modal button { width:100%; padding:10px; }
.modal select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text-primary);
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 14px;
}
.error { 
  color:#DC2626; 
  font-size:13px; 
  margin-top:8px;
  padding: 8px 12px;
  background: #FEE2E2;
  border-radius: 6px;
}

textarea {
  width: 100%;
  min-height: 300px;
  padding: 12px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text-primary);
  border-radius: 6px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace;
  font-size: 12px;
  resize: vertical;
  transition: all 0.15s ease;
}
textarea:focus {
  outline: none;
  border-color: var(--purple);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
textarea::placeholder {
  color: var(--text-secondary);
}

/* Scrollbar styling */
.list::-webkit-scrollbar, 
.tab-content::-webkit-scrollbar, 
.response-body::-webkit-scrollbar { 
  width: 6px; 
  height: 6px;
}
.list::-webkit-scrollbar-track,
.tab-content::-webkit-scrollbar-track,
.response-body::-webkit-scrollbar-track {
  background: transparent;
}
.list::-webkit-scrollbar-thumb, 
.tab-content::-webkit-scrollbar-thumb, 
.response-body::-webkit-scrollbar-thumb { 
  background: var(--border); 
  border-radius: 3px;
}
.list::-webkit-scrollbar-thumb:hover,
.tab-content::-webkit-scrollbar-thumb:hover,
.response-body::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
</head>
<body>
  <div class="app">
    <!-- Header -->
    <div class="header">
      <div class="brand">
        <img src="${logo}" width="20" height="20" />
        <span id="welcome">Authrator</span>
      </div>
      <div class="actions" id="header-actions">
        <button id="btn-create-collection">New Collection</button>
        <button id="btn-theme" class="theme-btn" title="Toggle theme">
          <svg id="theme-icon-sun" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="display:none;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg id="theme-icon-moon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
        <button id="btn-login">Login</button>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="main-content">
      <!-- Left Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <strong>Collections</strong>
        </div>
        <div class="search-box">
          <input id="search" placeholder="Search APIs..." />
        </div>
        <div class="list" id="list"></div>
      </aside>
      
      <!-- Right Panel -->
      <div class="right-panel" id="right-panel">
        <div class="api-tabs-bar">
          <div class="api-tabs" id="api-tabs"></div>
          <button id="api-tab-add" class="icon-btn" title="New API">+</button>
        </div>
        <div class="empty-state" id="empty-state">
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
          <p>Select an API from the sidebar or create a new one</p>
        </div>
        
        <div class="api-editor" id="api-editor" style="display:none;">
          <div class="editor-header">
            <div class="url-bar">
              <select id="method-select">
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
                <option>PATCH</option>
                <option>HEAD</option>
                <option>OPTIONS</option>
              </select>
              <input id="url-input" placeholder="Enter request URL" />
              <button id="send-btn">Send</button>
            </div>
          </div>
          
          <div class="editor-tabs">
            <button class="editor-tab active" data-tab="params">Params</button>
            <button class="editor-tab" data-tab="headers">Headers</button>
            <button class="editor-tab" data-tab="body">Body</button>
          </div>
          
          <div class="tab-content" id="tab-content">
            <!-- Tab content will be rendered here -->
          </div>
          
          <div class="response-section" id="response-section" style="display:none;">
            <div class="response-header">
              <span>Response</span>
              <span class="response-status" id="response-status"></span>
            </div>
            <div class="response-body">
              <pre class="response-editor" id="response-editor"></pre>
            </div>
          </div>
          
          <div class="loading" id="loading" style="display:none;">Sending request...</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Auth Modal -->
  <div class="overlay" id="auth-overlay">
    <div class="modal">
      <h2>Welcome to Authrator</h2>
      <div class="modal-tabs">
        <button class="modal-tab active" id="tab-login">Login</button>
        <button class="modal-tab" id="tab-signup">Sign Up</button>
      </div>
      <div>
        <input id="email" type="email" placeholder="Email address" />
        <input id="password" type="password" placeholder="Password" />
        <button id="auth-submit">Login</button>
        <div id="auth-error" class="error" style="display:none;"></div>
      </div>
    </div>
  </div>
  
  <!-- Create Collection Modal -->
  <div class="overlay" id="collection-overlay">
    <div class="modal">
      <h2>Create Collection</h2>
      <input id="col-name" placeholder="Collection name" />
      <input id="col-color" type="hidden" value="#8B5CF6" />
      <div id="col-palette" style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 12px;"></div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button id="col-cancel" class="btn-secondary" style="flex:1;">Cancel</button>
        <button id="col-submit" style="flex:1;">Create</button>
      </div>
    </div>
  </div>

  <!-- Create API Modal -->
  <div class="overlay" id="api-overlay">
    <div class="modal">
      <h2>Create API</h2>
      <input id="api-name" placeholder="API name" />
      <select id="api-method">
        <option>GET</option>
        <option>POST</option>
        <option>PUT</option>
        <option>DELETE</option>
        <option>PATCH</option>
        <option>HEAD</option>
        <option>OPTIONS</option>
      </select>
      <input id="api-url" placeholder="https://api.example.com/path" />
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button id="api-cancel" class="btn-secondary" style="flex:1;">Cancel</button>
        <button id="api-submit" style="flex:1;">Create</button>
      </div>
    </div>
  </div>

  <!-- Rename Collection Modal -->
  <div class="overlay" id="rename-collection-overlay">
    <div class="modal">
      <h2>Rename Collection</h2>
      <input id="rename-col-name" placeholder="Collection name" />
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button id="rename-col-cancel" class="btn-secondary" style="flex:1;">Cancel</button>
        <button id="rename-col-submit" style="flex:1;">Rename</button>
      </div>
    </div>
  </div>

  <!-- Delete Collection Modal -->
  <div class="overlay" id="delete-collection-overlay">
    <div class="modal">
      <h2>Delete Collection</h2>
      <p style="margin-bottom:16px;color:var(--text-secondary);line-height:1.5;">Are you sure you want to delete this collection? This will delete all APIs inside it. This action cannot be undone.</p>
      <div style="display:flex;gap:8px;">
        <button id="delete-col-cancel" class="btn-secondary" style="flex:1;">Cancel</button>
        <button id="delete-col-submit" style="flex:1;background:#DC2626;">Delete</button>
      </div>
    </div>
  </div>

  <!-- Rename API Modal -->
  <div class="overlay" id="rename-api-overlay">
    <div class="modal">
      <h2>Rename API</h2>
      <input id="rename-api-name" placeholder="API name" />
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button id="rename-api-cancel" class="btn-secondary" style="flex:1;">Cancel</button>
        <button id="rename-api-submit" style="flex:1;">Rename</button>
      </div>
    </div>
  </div>

  <!-- Delete API Modal -->
  <div class="overlay" id="delete-api-overlay">
    <div class="modal">
      <h2>Delete API</h2>
      <p style="margin-bottom:16px;color:var(--text-secondary);line-height:1.5;">Are you sure you want to delete this API? This action cannot be undone.</p>
      <div style="display:flex;gap:8px;">
        <button id="delete-api-cancel" class="btn-secondary" style="flex:1;">Cancel</button>
        <button id="delete-api-submit" style="flex:1;background:#DC2626;">Delete</button>
      </div>
    </div>
  </div>

  <!-- Move API Modal -->
  <div class="overlay" id="move-api-overlay">
    <div class="modal">
      <h2>Move to Collection</h2>
      <select id="move-api-target" style="width:100%;padding:10px 12px;border:1px solid var(--input-border);background:var(--input-bg);color:var(--text-primary);border-radius:6px;margin-bottom:12px;font-size:14px;">
        <option value="">Select a collection</option>
      </select>
      <div style="display:flex;gap:8px;">
        <button id="move-api-cancel" class="btn-secondary" style="flex:1;">Cancel</button>
        <button id="move-api-submit" style="flex:1;">Move</button>
      </div>
    </div>
  </div>

<script>
  const vscode = acquireVsCodeApi();
  
  // State
  let state = { isLoggedIn: false, user: null, collections: [] };
  let expandedCollections = new Set();
  let currentApi = null;
  let openApis = [];
  let activeTab = 'params';
  let authMode = 'login';
  let searchQuery = '';
  let theme = 'light';
  let wasLoggedIn = null;
  let activeCollectionForAction = null;
  let activeApiForAction = null;
  
  // Elements
  const listEl = document.getElementById('list');
  const headerActions = document.getElementById('header-actions');
  const authOverlay = document.getElementById('auth-overlay');
  const collectionOverlay = document.getElementById('collection-overlay');
  const emptyState = document.getElementById('empty-state');
  const apiEditor = document.getElementById('api-editor');
  const tabContent = document.getElementById('tab-content');
  const responseSection = document.getElementById('response-section');
  const responseEditor = document.getElementById('response-editor');
  const responseStatus = document.getElementById('response-status');
  const loading = document.getElementById('loading');
  
  // Main render function
  function render() {
    renderHeader();
    renderSidebar();
    renderApiTabs();
    renderApiEditor();
  }
  
  function renderHeader() {
    headerActions.innerHTML = '';
    
    const createBtn = document.createElement('button');
    createBtn.textContent = 'New Collection';
    createBtn.onclick = () => collectionOverlay.style.display = 'flex';
    headerActions.appendChild(createBtn);
    
    const themeBtn = document.createElement('button');
    themeBtn.id = 'btn-theme';
    themeBtn.className = 'theme-btn';
    themeBtn.title = 'Toggle theme';
    themeBtn.onclick = toggleTheme;
    
    const sunIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    sunIcon.id = 'theme-icon-sun';
    sunIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    sunIcon.setAttribute('fill', 'none');
    sunIcon.setAttribute('viewBox', '0 0 24 24');
    sunIcon.setAttribute('stroke', 'currentColor');
    sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
    sunIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />';
    
    const moonIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    moonIcon.id = 'theme-icon-moon';
    moonIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    moonIcon.setAttribute('fill', 'none');
    moonIcon.setAttribute('viewBox', '0 0 24 24');
    moonIcon.setAttribute('stroke', 'currentColor');
    moonIcon.style.display = theme === 'light' ? 'block' : 'none';
    moonIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
    
    themeBtn.appendChild(sunIcon);
    themeBtn.appendChild(moonIcon);
    headerActions.appendChild(themeBtn);
    
    if (!state.isLoggedIn) {
      const loginBtn = document.createElement('button');
      loginBtn.textContent = 'Login';
      loginBtn.className = 'btn-secondary';
      loginBtn.onclick = () => authOverlay.style.display = 'flex';
      headerActions.appendChild(loginBtn);
    } else {
      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'btn-secondary';
      logoutBtn.textContent = 'Logout';
      logoutBtn.onclick = () => vscode.postMessage({ action: 'logout' });
      headerActions.appendChild(logoutBtn);
    }
  }
  
  function renderSidebar() {
    listEl.innerHTML = '';
    
    if (!state.collections || state.collections.length === 0) {
      const empty = document.createElement('div');
      empty.style.padding = '20px';
      empty.style.textAlign = 'center';
      empty.style.color = 'var(--text-secondary)';
      empty.textContent = 'No collections yet';
      listEl.appendChild(empty);
      return;
    }
    
    // Add unsaved APIs section if any
    const unsavedApis = openApis.filter(a => a.isTemp);
    if (unsavedApis.length > 0) {
      const unsavedSection = document.createElement('div');
      unsavedSection.className = 'collection';
      
      const header = document.createElement('div');
      header.className = 'collection-header';
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'collection-name';
      nameDiv.innerHTML = '<div class="collection-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div><span style="flex:1">Unsaved APIs</span>';
      
      const chevron = document.createElement('span');
      chevron.textContent = '▾';
      chevron.style.marginLeft = '4px';
      chevron.style.fontSize = '10px';
      
      header.appendChild(nameDiv);
      header.appendChild(chevron);
      header.onclick = () => {
        const apisDiv = unsavedSection.querySelector('.apis');
        if (apisDiv) {
          const isExpanded = apisDiv.style.display !== 'none';
          apisDiv.style.display = isExpanded ? 'none' : 'block';
          chevron.textContent = isExpanded ? '▸' : '▾';
        }
      };
      
      unsavedSection.appendChild(header);
      
      const apisDiv = document.createElement('div');
      apisDiv.className = 'apis';
      
      unsavedApis.forEach(api => {
        const apiItem = document.createElement('div');
        apiItem.className = 'api-item unsaved';
        if (currentApi && currentApi.__id === api.__id) {
          apiItem.classList.add('active');
        }
        
        const content = document.createElement('div');
        content.className = 'api-item-content';
        
        const methodSpan = document.createElement('span');
        methodSpan.className = 'method ' + (api.method || 'GET');
        methodSpan.textContent = api.method || 'GET';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = api.name || 'Untitled';
        nameSpan.style.flex = '1';
        
        content.appendChild(methodSpan);
        content.appendChild(nameSpan);
        
        const moreBtn = document.createElement('button');
        moreBtn.className = 'more-btn';
        moreBtn.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg>';
        moreBtn.title = 'Options';
        moreBtn.onclick = (e) => {
          e.stopPropagation();
          showApiMenu(api, e);
        };
        
        apiItem.appendChild(content);
        apiItem.appendChild(moreBtn);
        
        apiItem.onclick = () => {
          currentApi = api;
          activeTab = 'params';
          responseSection.style.display = 'none';
          render();
        };
        
        apisDiv.appendChild(apiItem);
      });
      
      unsavedSection.appendChild(apisDiv);
      listEl.appendChild(unsavedSection);
    }
    
    state.collections.forEach(collection => {
      const apisAll = collection.apis || [];
      const apis = (searchQuery || '').trim() ? apisAll.filter(a => {
        const q = searchQuery.toLowerCase();
        return (a.name||'').toLowerCase().includes(q) || (a.url||'').toLowerCase().includes(q) || (a.method||'').toLowerCase().includes(q);
      }) : apisAll;
      const colMatches = (collection.name||'').toLowerCase().includes((searchQuery||'').toLowerCase());
      if ((searchQuery||'').trim() && apis.length === 0 && !colMatches) { return; }
      const collectionEl = document.createElement('div');
      collectionEl.className = 'collection';
      
      // Collection header
      const header = document.createElement('div');
      header.className = 'collection-header';
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'collection-name';
      
      const colorIcon = document.createElement('div');
      colorIcon.className = 'collection-icon';
colorIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="' + (collection.color || '#8B5CF6') + '"><path d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z"/></svg>';      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = collection.name;
      nameSpan.style.flex = '1';
      
      nameDiv.appendChild(colorIcon);
      nameDiv.appendChild(nameSpan);
      
      const actions = document.createElement('div');
      actions.className = 'collection-actions';
      
      const addBtn = document.createElement('button');
      addBtn.className = 'icon-btn';
      addBtn.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" fill="none"/></svg>';
      addBtn.title = 'Add API';
      addBtn.onclick = (e) => {
        e.stopPropagation();
        openApiModal(collection.id);
      };
      
      
      const renameBtn = document.createElement('button');
      renameBtn.className = 'icon-btn';
      renameBtn.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M2 12v2h2l7-7-2-2-7 7zM14 4l-2-2-2 2 2 2 2-2z" fill="currentColor"/></svg>';
      renameBtn.title = 'Rename Collection';
      renameBtn.onclick = (e) => {
        e.stopPropagation();
        renameCollection(collection);
      };
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'icon-btn';
      deleteBtn.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 4h10M5 4V3h6v1M5 6v6h6V6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>';
      deleteBtn.title = 'Delete Collection';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteCollection(collection);
      };
      
      const chevron = document.createElement('span');
      chevron.textContent = expandedCollections.has(collection.id) ? '▾' : '▸';
      chevron.style.marginLeft = '4px';
      chevron.style.fontSize = '10px';
      
      actions.appendChild(addBtn);
      actions.appendChild(renameBtn);
      actions.appendChild(deleteBtn);
      header.appendChild(nameDiv);
      header.appendChild(actions);
      header.appendChild(chevron);
      
      header.onclick = () => {
        if (expandedCollections.has(collection.id)) {
          expandedCollections.delete(collection.id);
        } else {
          expandedCollections.add(collection.id);
        }
        render();
      };
      
      collectionEl.appendChild(header);
      
      // APIs list
      if (expandedCollections.has(collection.id) || ((searchQuery||'').trim() && apis.length>0)) {
        const apisDiv = document.createElement('div');
        apisDiv.className = 'apis';
        
        apis.forEach(api => {
          const apiItem = document.createElement('div');
          apiItem.className = 'api-item';
          if (currentApi && currentApi.id === api.id) {
            apiItem.classList.add('active');
          }
          
          const content = document.createElement('div');
          content.className = 'api-item-content';
          
          const methodSpan = document.createElement('span');
          methodSpan.className = 'method ' + (api.method || 'GET');
          methodSpan.textContent = api.method || 'GET';
          
          const nameSpan = document.createElement('span');
          nameSpan.textContent = api.name;
          nameSpan.style.flex = '1';
          
          content.appendChild(methodSpan);
          content.appendChild(nameSpan);
          
          const moreBtn = document.createElement('button');
          moreBtn.className = 'more-btn';
          moreBtn.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg>';
          moreBtn.title = 'Options';
          moreBtn.onclick = (e) => {
            e.stopPropagation();
            showApiMenu(api, e);
          };
          
          apiItem.appendChild(content);
          apiItem.appendChild(moreBtn);
          
          apiItem.onclick = () => {
            const openId = 'api-' + api.id;
            let existing = openApis.find(a => a.__id === openId);
            if (!existing) {
              existing = { __id: openId, isTemp: false, ...api, collectionId: collection.id };
              openApis.push(existing);
            }
            currentApi = existing;
            activeTab = 'params';
            responseSection.style.display = 'none';
            render();
          };
          
          apisDiv.appendChild(apiItem);
        });
        
        collectionEl.appendChild(apisDiv);
      }
      
      listEl.appendChild(collectionEl);
    });
  }
  
  function renderApiEditor() {
    if (!currentApi) {
      emptyState.style.display = 'flex';
      apiEditor.style.display = 'none';
      return;
    }
    
    emptyState.style.display = 'none';
    apiEditor.style.display = 'flex';
    
    // Set method and URL
    document.getElementById('method-select').value = currentApi.method || 'GET';
    document.getElementById('url-input').value = currentApi.url || '';
    
    // Set active tab
    document.querySelectorAll('.editor-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === activeTab);
    });
    
    // Render tab content
    renderTabContent();
  }

  function renderApiTabs() {
    const tabsEl = document.getElementById('api-tabs');
    if (!tabsEl) return;
    tabsEl.innerHTML = '';
    openApis.forEach((a) => {
      const btn = document.createElement('button');
      btn.className = 'api-tab' + ((currentApi && currentApi.__id === a.__id) ? ' active' : '');
      const label = document.createElement('span');
      label.textContent = (a.name || 'Untitled');
      const close = document.createElement('span');
      close.textContent = '×';
      close.className = 'close';
      close.onclick = (e) => {
        e.stopPropagation();
        const idx = openApis.findIndex(x => x.__id === a.__id);
        if (idx > -1) {
          const wasCurrent = currentApi && currentApi.__id === a.__id;
          openApis.splice(idx, 1);
          if (wasCurrent) {
            currentApi = openApis.length ? openApis[Math.max(0, idx - 1)] : null;
          }
          render();
        }
      };
      btn.onclick = () => {
        currentApi = a;
        activeTab = 'params';
        responseSection.style.display = 'none';
        render();
      };
      btn.appendChild(label);
      btn.appendChild(close);
      tabsEl.appendChild(btn);
    });
  }
  
  function renderTabContent() {
    tabContent.innerHTML = '';
    
    if (activeTab === 'params') {
      const params = currentApi.queryParams || [];
      params.forEach((param, i) => {
        const row = createParamRow(param, i, 'queryParams');
        tabContent.appendChild(row);
      });
      
      const addBtn = document.createElement('button');
      addBtn.textContent = '+ Add Parameter';
      addBtn.className = 'btn-secondary';
      addBtn.style.marginTop = '8px';
      addBtn.onclick = () => {
        if (!currentApi.queryParams) currentApi.queryParams = [];
        currentApi.queryParams.push({ key: '', value: '' });
        renderTabContent();
      };
      tabContent.appendChild(addBtn);
    } else if (activeTab === 'headers') {
      const headers = currentApi.headers || [];
      headers.forEach((header, i) => {
        const row = createParamRow(header, i, 'headers');
        tabContent.appendChild(row);
      });
      
      const addBtn = document.createElement('button');
      addBtn.textContent = '+ Add Header';
      addBtn.className = 'btn-secondary';
      addBtn.style.marginTop = '8px';
      addBtn.onclick = () => {
        if (!currentApi.headers) currentApi.headers = [];
        currentApi.headers.push({ key: '', value: '' });
        renderTabContent();
      };
      tabContent.appendChild(addBtn);
    } else if (activeTab === 'body') {
      const textarea = document.createElement('textarea');
      textarea.placeholder = 'Request body (JSON, XML, etc.)';
      textarea.value = typeof currentApi.body === 'string' ? currentApi.body : 
                      (currentApi.body && currentApi.body.content) || '';
      textarea.oninput = (e) => {
        currentApi.body = e.target.value;
      };
      tabContent.appendChild(textarea);
    }
  }
  
  function createParamRow(param, index, type) {
    const row = document.createElement('div');
    row.className = 'param-row';
    
    const keyInput = document.createElement('input');
    keyInput.placeholder = 'Key';
    keyInput.value = param.key || '';
    keyInput.oninput = (e) => {
      currentApi[type][index].key = e.target.value;
    };
    
    const valueInput = document.createElement('input');
    valueInput.placeholder = 'Value';
    valueInput.value = param.value || '';
    valueInput.oninput = (e) => {
      currentApi[type][index].value = e.target.value;
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'btn-secondary';
    deleteBtn.onclick = () => {
      currentApi[type].splice(index, 1);
      renderTabContent();
    };
    
    row.appendChild(keyInput);
    row.appendChild(valueInput);
    row.appendChild(deleteBtn);
    
    return row;
  }
  
  function openApiModal(collectionId) {
    const modal = document.getElementById('api-overlay');
    modal.dataset.collectionId = collectionId;
    document.getElementById('api-name').value = '';
    document.getElementById('api-url').value = '';
    document.getElementById('api-method').value = 'GET';
    modal.style.display = 'flex';
  }
  
  function createInstantApi(collectionId) {
    const id = 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const a = { __id: id, isTemp: true, name: 'Untitled API', method: 'GET', url: '', headers: [], queryParams: [], body: '', collectionId };
    openApis.push(a);
    currentApi = a;
    activeTab = 'params';
    responseSection.style.display = 'none';
    expandedCollections.add(collectionId);
    render();
  }
  
  function showApiMenu(api, event) {
    // Remove existing menus
    document.querySelectorAll('.dropdown-menu').forEach(m => m.remove());
    
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu show';
    menu.style.position = 'fixed';
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';
    
    if (api.isTemp) {
      // Unsaved API - show inline save target collections
      const title = document.createElement('div');
      title.className = 'dropdown-item';
      title.style.cursor = 'default';
      title.innerHTML = '<strong>Save to Collection</strong>';
      menu.appendChild(title);

      const cols = state.collections || [];
      if (cols.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'dropdown-item';
        empty.style.cursor = 'default';
        empty.textContent = 'No collections found';
        menu.appendChild(empty);
      } else {
        cols.forEach(c => {
          const item = document.createElement('button');
          item.className = 'dropdown-item';
          const dot = '<span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:' + (c.color||'#8B5CF6') + '"></span>';
          item.innerHTML = dot + '<span>' + ' ' + (c.name||'Collection') + '</span>';
          item.onclick = () => {
            menu.remove();
            const payloadApi = { ...api, collectionId: c.id };
            vscode.postMessage({ action: 'saveUnsavedApi', api: payloadApi, tempId: api.__id });
          };
          menu.appendChild(item);
        });
      }

      const divider = document.createElement('div');
      divider.style.borderTop = '1px solid var(--border)';
      divider.style.margin = '4px 0';
      menu.appendChild(divider);

      const deleteItem = document.createElement('button');
      deleteItem.className = 'dropdown-item danger';
      deleteItem.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 4h10M5 4V3h6v1M5 6v6h6V6" stroke="currentColor" fill="none"/></svg><span> Delete</span>';
      deleteItem.onclick = () => {
        menu.remove();
        const idx = openApis.findIndex(a => a.__id === api.__id);
        if (idx > -1) {
          openApis.splice(idx, 1);
          if (currentApi && currentApi.__id === api.__id) {
            currentApi = openApis.length ? openApis[0] : null;
          }
          render();
        }
      };
      menu.appendChild(deleteItem);
    } else {
      // Saved API
      const renameItem = document.createElement('button');
      renameItem.className = 'dropdown-item';
      renameItem.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M2 12v2h2l7-7-2-2-7 7zM14 4l-2-2-2 2 2 2 2-2z" fill="currentColor"/></svg><span> Rename</span>';
      renameItem.onclick = () => {
        menu.remove();
        activeApiForAction = api;
        document.getElementById('rename-api-name').value = api.name || '';
        document.getElementById('rename-api-overlay').style.display = 'flex';
      };
      menu.appendChild(renameItem);
      
      const moveItem = document.createElement('button');
      moveItem.className = 'dropdown-item';
      moveItem.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M2 4h4l2 2h6v6H2z" stroke="currentColor" fill="none"/></svg><span> Move to Collection</span>';
      moveItem.onclick = () => {
        menu.remove();
        activeApiForAction = api;
        openMoveApiModal(api);
      };
      menu.appendChild(moveItem);
      
      const deleteItem = document.createElement('button');
      deleteItem.className = 'dropdown-item danger';
      deleteItem.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 4h10M5 4V3h6v1M5 6v6h6V6" stroke="currentColor" fill="none"/></svg><span> Delete</span>';
      deleteItem.onclick = () => {
        menu.remove();
        activeApiForAction = api;
        document.getElementById('delete-api-overlay').style.display = 'flex';
      };
      menu.appendChild(deleteItem);
    }
    
    document.body.appendChild(menu);
    
    // Close menu on click outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      }, 100);
    }, 0);
  }
  
  function openMoveApiModal(api) {
    const select = document.getElementById('move-api-target');
    select.innerHTML = '<option value="">Select a collection</option>';
    
    const collections = state.collections || [];
    collections.forEach(col => {
      if (col.id !== api.collectionId) {
        const option = document.createElement('option');
        option.value = col.id;
        option.textContent = col.name;
        select.appendChild(option);
      }
    });
    
    document.getElementById('move-api-overlay').style.display = 'flex';
  }
  
  function renameCollection(collection) {
    activeCollectionForAction = collection;
    document.getElementById('rename-col-name').value = collection.name || '';
    document.getElementById('rename-collection-overlay').style.display = 'flex';
  }
  
  function deleteCollection(collection) {
    activeCollectionForAction = collection;
    document.getElementById('delete-collection-overlay').style.display = 'flex';
  }
  
  // Event listeners
  document.getElementById('method-select').onchange = (e) => {
    if (currentApi) {
      currentApi.method = e.target.value;
      if (!currentApi.isTemp && currentApi.id && currentApi.collectionId) {
        vscode.postMessage({ action: 'updateApi', api: currentApi });
      }
    }
  };
  
  document.getElementById('url-input').oninput = (e) => {
    if (currentApi) {
      currentApi.url = e.target.value;
      if (!currentApi.isTemp && currentApi.id && currentApi.collectionId) {
        vscode.postMessage({ action: 'updateApi', api: currentApi });
      }
    }
  };
  
  document.getElementById('send-btn').onclick = () => {
    if (!currentApi) return;
    
    loading.style.display = 'block';
    responseSection.style.display = 'none';
    
    vscode.postMessage({ 
      action: 'sendRequest', 
      api: currentApi 
    });
  };
  
  document.querySelectorAll('.editor-tab').forEach(tab => {
    tab.onclick = () => {
      activeTab = tab.dataset.tab;
      render();
    };
  });
  
  // Auth modal
  document.getElementById('tab-login').onclick = () => {
    authMode = 'login';
    document.getElementById('tab-login').classList.add('active');
    document.getElementById('tab-signup').classList.remove('active');
    document.getElementById('auth-submit').textContent = 'Login';
  };
  
  document.getElementById('tab-signup').onclick = () => {
    authMode = 'signup';
    document.getElementById('tab-signup').classList.add('active');
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('auth-submit').textContent = 'Sign Up';
  };
  
  document.getElementById('auth-submit').onclick = () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    document.getElementById('auth-error').style.display = 'none';
    vscode.postMessage({ action: authMode, payload: { email, password } });
  };
  
  authOverlay.onclick = (e) => {
    if (e.target === authOverlay) authOverlay.style.display = 'none';
  };
  
  // Collection modal
  document.getElementById('col-submit').onclick = () => {
    const name = document.getElementById('col-name').value || 'New Collection';
    const color = document.getElementById('col-color').value || '#8B5CF6';
    vscode.postMessage({ action: 'createCollection', payload: { name, color } });
    collectionOverlay.style.display = 'none';
  };
  
  document.getElementById('col-cancel').onclick = () => {
    collectionOverlay.style.display = 'none';
  };
  
  collectionOverlay.onclick = (e) => {
    if (e.target === collectionOverlay) collectionOverlay.style.display = 'none';
  };

  // API modal
  const apiOverlay = document.getElementById('api-overlay');
  document.getElementById('api-submit').onclick = () => {
    const name = document.getElementById('api-name').value || 'New API';
    const method = document.getElementById('api-method').value || 'GET';
    const url = document.getElementById('api-url').value || '';
    const collectionId = apiOverlay.dataset.collectionId;
    vscode.postMessage({ action: 'createApi', payload: { collectionId, name, method, url } });
    apiOverlay.style.display = 'none';
  };
  document.getElementById('api-cancel').onclick = () => { apiOverlay.style.display = 'none'; };
  apiOverlay.onclick = (e) => { if (e.target === apiOverlay) apiOverlay.style.display = 'none'; };

  // Rename Collection modal
  const renameColOverlay = document.getElementById('rename-collection-overlay');
  document.getElementById('rename-col-submit').onclick = () => {
    if (!activeCollectionForAction) return;
    const newName = document.getElementById('rename-col-name').value.trim();
    if (!newName) return;
    vscode.postMessage({ 
      action: 'renameCollection', 
      collectionId: activeCollectionForAction.id,
      name: newName,
      color: activeCollectionForAction.color || '#8B5CF6'
    });
    renameColOverlay.style.display = 'none';
    activeCollectionForAction = null;
  };
  document.getElementById('rename-col-cancel').onclick = () => { 
    renameColOverlay.style.display = 'none'; 
    activeCollectionForAction = null;
  };
  renameColOverlay.onclick = (e) => { 
    if (e.target === renameColOverlay) {
      renameColOverlay.style.display = 'none';
      activeCollectionForAction = null;
    }
  };

  // Delete Collection modal
  const deleteColOverlay = document.getElementById('delete-collection-overlay');
  document.getElementById('delete-col-submit').onclick = () => {
    if (!activeCollectionForAction) return;
    vscode.postMessage({ 
      action: 'deleteCollection', 
      collectionId: activeCollectionForAction.id
    });
    deleteColOverlay.style.display = 'none';
    activeCollectionForAction = null;
  };
  document.getElementById('delete-col-cancel').onclick = () => { 
    deleteColOverlay.style.display = 'none'; 
    activeCollectionForAction = null;
  };
  deleteColOverlay.onclick = (e) => { 
    if (e.target === deleteColOverlay) {
      deleteColOverlay.style.display = 'none';
      activeCollectionForAction = null;
    }
  };

  // Rename API modal
  const renameApiOverlay = document.getElementById('rename-api-overlay');
  document.getElementById('rename-api-submit').onclick = () => {
    if (!activeApiForAction) return;
    const newName = document.getElementById('rename-api-name').value.trim();
    if (!newName) return;
    vscode.postMessage({ 
      action: 'renameApi', 
      apiId: activeApiForAction.id,
      name: newName
    });
    renameApiOverlay.style.display = 'none';
    activeApiForAction = null;
  };
  document.getElementById('rename-api-cancel').onclick = () => { 
    renameApiOverlay.style.display = 'none'; 
    activeApiForAction = null;
  };
  renameApiOverlay.onclick = (e) => { 
    if (e.target === renameApiOverlay) {
      renameApiOverlay.style.display = 'none';
      activeApiForAction = null;
    }
  };

  // Delete API modal
  const deleteApiOverlay = document.getElementById('delete-api-overlay');
  document.getElementById('delete-api-submit').onclick = () => {
    if (!activeApiForAction) return;
    vscode.postMessage({ 
      action: 'deleteApi', 
      apiId: activeApiForAction.id
    });
    deleteApiOverlay.style.display = 'none';
    activeApiForAction = null;
  };
  document.getElementById('delete-api-cancel').onclick = () => { 
    deleteApiOverlay.style.display = 'none'; 
    activeApiForAction = null;
  };
  deleteApiOverlay.onclick = (e) => { 
    if (e.target === deleteApiOverlay) {
      deleteApiOverlay.style.display = 'none';
      activeApiForAction = null;
    }
  };

  // Move API modal
  const moveApiOverlay = document.getElementById('move-api-overlay');
  document.getElementById('move-api-submit').onclick = () => {
    if (!activeApiForAction) return;
    const targetCollectionId = document.getElementById('move-api-target').value;
    if (!targetCollectionId) return;
    vscode.postMessage({ 
      action: 'moveApi', 
      apiId: activeApiForAction.id,
      targetCollectionId: targetCollectionId
    });
    moveApiOverlay.style.display = 'none';
    activeApiForAction = null;
  };
  document.getElementById('move-api-cancel').onclick = () => { 
    moveApiOverlay.style.display = 'none'; 
    activeApiForAction = null;
  };
  moveApiOverlay.onclick = (e) => { 
    if (e.target === moveApiOverlay) {
      moveApiOverlay.style.display = 'none';
      activeApiForAction = null;
    }
  };

  // API tabs add (unsaved)
  document.getElementById('api-tab-add').onclick = () => {
    const id = 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const a = { __id: id, isTemp: true, name: 'Untitled', method: 'GET', url: '', headers: [], queryParams: [], body: '' };
    openApis.push(a);
    currentApi = a;
    activeTab = 'params';
    responseSection.style.display = 'none';
    render();
  };

  // Search
  document.getElementById('search').oninput = (e) => { searchQuery = e.target.value || ''; render(); };

  // Theme
  function applyTheme() {
    document.body.setAttribute('data-theme', theme);
    const s = vscode.getState() || {};
    vscode.setState({ ...s, theme });
    
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    if (sunIcon && moonIcon) {
      sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
      moonIcon.style.display = theme === 'light' ? 'block' : 'none';
    }
  }
  
  function toggleTheme() { 
    theme = theme === 'dark' ? 'light' : 'dark'; 
    applyTheme();
    render();
  }
  
  // Message handler
  window.addEventListener('message', (e) => {
    const msg = e.data;
    
    if (msg.type === 'state') {
      const prev = state;
      state = msg.state;
      if (wasLoggedIn === null) wasLoggedIn = state.isLoggedIn;
      if (wasLoggedIn !== state.isLoggedIn) {
        currentApi = null;
        activeTab = 'params';
        document.getElementById('search').value = '';
        searchQuery = '';
        wasLoggedIn = state.isLoggedIn;
      }
      render();
    } else if (msg.type === 'auth:ok') {
      authOverlay.style.display = 'none';
      currentApi = null;
      activeTab = 'params';
      responseSection.style.display = 'none';
      render();
    } else if (msg.type === 'response') {
      loading.style.display = 'none';
      responseSection.style.display = 'flex';
      
      const { status, statusText, data, time } = msg.response;
      responseStatus.textContent = status + ' ' + (statusText || '') + ' • ' + time + 'ms';
      
      try {
        responseEditor.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      } catch {
        responseEditor.textContent = String(data);
      }
    } else if (msg.type === 'api:created') {
      const created = msg.api;
      if (created && created.id) {
        expandedCollections.add(msg.collectionId);
        const openId = 'api-' + created.id;
        // If this was created from an unsaved temp API, remove the temp entry from the Unsaved section
        if (msg.tempId) {
          const tmpIdx = openApis.findIndex(a => a.__id === msg.tempId);
          if (tmpIdx > -1) {
            openApis.splice(tmpIdx, 1);
          }
        }
        let existing = openApis.find(a => a.__id === openId);
        if (!existing) {
          existing = { __id: openId, isTemp: false, ...created, collectionId: msg.collectionId };
          openApis.push(existing);
        }
        currentApi = existing;
        activeTab = 'params';
        render();
      }
    } else if (msg.type === 'error') {
      loading.style.display = 'none';
      document.getElementById('auth-error').textContent = msg.message || 'Operation failed';
      document.getElementById('auth-error').style.display = 'block';
    }
  });
  
  // Initialize
  const initState = vscode.getState() || {};
  theme = (initState.theme === 'dark') ? 'dark' : 'light';
  applyTheme();
  
  // palette for collections
  (function initPalette(){
    const colors = ['#8B5CF6','#EF4444','#10B981','#F59E0B','#3B82F6','#EC4899','#14B8A6','#F97316','#22C55E','#6366F1'];
    const el = document.getElementById('col-palette');
    let selected = document.getElementById('col-color').value || '#8B5CF6';
    function renderPal(){
      el.innerHTML = '';
      colors.forEach(c => {
        const b = document.createElement('button');
        b.style.width='20px'; b.style.height='20px'; b.style.borderRadius='999px'; b.style.border = selected===c ? '2px solid var(--text-primary)' : '2px solid transparent';
        b.style.background = c; b.style.cursor='pointer'; b.title=c;
        b.onclick = () => { selected = c; document.getElementById('col-color').value = c; renderPal(); };
        el.appendChild(b);
      });
    }
    renderPal();
  })();
  
  vscode.postMessage({ action: 'init' });
</script>
</body>
</html>`;

  const setHtml = () => { panel.webview.html = getHtml(); };
  setHtml();

  const postState = async () => {
    panel.webview.postMessage({ type: 'state', state: await getState() });
  };

  panel.webview.onDidReceiveMessage(async (message) => {
    try {
      switch (message.action) {
        case 'init':
        case 'refresh':
          await postState();
          break;
        case 'login':
          await auth.login(message.payload.email, message.payload.password);
          await postState();
          panel.webview.postMessage({ type: 'auth:ok' });
          vscode.window.showInformationMessage('Authrator: Login successful');
          break;
        case 'signup':
          await auth.signup(message.payload.email, message.payload.password);
          await postState();
          panel.webview.postMessage({ type: 'auth:ok' });
          vscode.window.showInformationMessage('Authrator: Signup successful');
          break;
        case 'logout':
          await auth.logout();
          await postState();
          vscode.window.showInformationMessage('Authrator: Logged out');
          break;
        case 'createCollection':
          if (auth.isLoggedIn && auth.userId) {
            await api.createCollection(message.payload.name, message.payload.color, auth.userId);
          } else {
            await local.createCollection(message.payload.name, message.payload.color);
          }
          await postState();
          break;
        case 'createApi':
          if (auth.isLoggedIn) {
            const created = await api.createApi(message.payload.collectionId, message.payload.name, message.payload.method, message.payload.url);
            await postState();
            panel.webview.postMessage({ type: 'api:created', api: created, collectionId: message.payload.collectionId });
          } else {
            const created = await local.createApi(message.payload.collectionId, message.payload.name, message.payload.method, message.payload.url);
            await postState();
            panel.webview.postMessage({ type: 'api:created', api: created, collectionId: message.payload.collectionId });
          }
          break;
        case 'updateApi':
          if (auth.isLoggedIn) {
            await api.updateApi(message.api);
          } else {
            await local.updateApi(message.api);
          }
          break;
        case 'sendRequest':
          try {
            const startTime = Date.now();
            const response = await api.sendRequest(message.api);
            const time = Date.now() - startTime;
            
            panel.webview.postMessage({
              type: 'response',
              response: {
                status: response.status,
                statusText: response.statusText,
                data: response.data,
                time
              }
            });
          } catch (error: any) {
            panel.webview.postMessage({
              type: 'response',
              response: {
                status: error.response?.status || 500,
                statusText: error.response?.statusText || 'Error',
                data: error.message || 'Request failed',
                time: 0
              }
            });
          }
          break;
        case 'renameApi':
          if (auth.isLoggedIn) {
            const apiToRename = await api.getApi(message.apiId);
            if (apiToRename) {
              await api.updateApi({ ...apiToRename, name: message.name });
              vscode.window.showInformationMessage('API renamed successfully');
            }
          } else {
            await local.updateApi({ id: message.apiId, name: message.name });
            vscode.window.showInformationMessage('API renamed successfully');
          }
          await postState();
          break;
        case 'deleteApi':
          if (auth.isLoggedIn) {
            await api.deleteApi(message.apiId);
            vscode.window.showInformationMessage('API deleted successfully');
          } else {
            await local.deleteApi(message.apiId);
            vscode.window.showInformationMessage('API deleted successfully');
          }
          await postState();
          break;
        case 'moveApi':
          if (auth.isLoggedIn) {
            const apiToMove = await api.getApi(message.apiId);
            if (apiToMove) {
              await api.updateApi({ ...apiToMove, collectionId: message.targetCollectionId });
              vscode.window.showInformationMessage('API moved successfully');
            }
          } else {
            await local.moveApi(message.apiId, message.targetCollectionId);
            vscode.window.showInformationMessage('API moved successfully');
          }
          await postState();
          break;
        case 'saveUnsavedApi':
          if (auth.isLoggedIn) {
            const created = await api.createApi(
              message.api.collectionId,
              message.api.name || 'Untitled',
              message.api.method || 'GET',
              message.api.url || ''
            );
            if (created) {
              await api.updateApi({
                ...created,
                headers: message.api.headers || [],
                queryParams: message.api.queryParams || [],
                body: message.api.body || ''
              });
              panel.webview.postMessage({ type: 'api:created', api: created, collectionId: message.api.collectionId, tempId: message.tempId });
            }
          } else {
            const created = await local.createApi(
              message.api.collectionId,
              message.api.name || 'Untitled',
              message.api.method || 'GET',
              message.api.url || ''
            );
            panel.webview.postMessage({ type: 'api:created', api: created, collectionId: message.api.collectionId, tempId: message.tempId });
          }
          await postState();
          vscode.window.showInformationMessage('API saved successfully');
          break;
        case 'renameCollection':
          if (auth.isLoggedIn && auth.userId) {
            await api.renameCollection(message.collectionId, message.name, message.color);
            vscode.window.showInformationMessage('Collection renamed successfully');
          } else {
            await local.updateCollection(message.collectionId, message.name);
            vscode.window.showInformationMessage('Collection renamed successfully');
          }
          await postState();
          break;
        case 'deleteCollection':
          if (auth.isLoggedIn) {
            await api.deleteCollection(message.collectionId);
            vscode.window.showInformationMessage('Collection deleted successfully');
          } else {
            await local.deleteCollection(message.collectionId);
            vscode.window.showInformationMessage('Collection deleted successfully');
          }
          await postState();
          break;
      }
    } catch (e:any) {
      panel.webview.postMessage({ type: 'error', message: e?.message || 'Operation failed' });
    }
  });
}