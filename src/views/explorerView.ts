import * as vscode from 'vscode';

export class ExplorerViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'authrator.explorer';
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
    };

    const logo = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'icon.png')
    );
    const csp = webviewView.webview.cspSource;

    webviewView.webview.html = this.getHtml(logo, csp);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message?.action === 'openDashboard') {
        await vscode.commands.executeCommand('authrator.open');
      }
    });
  }

  private getHtml(logo: vscode.Uri, cspSource: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https: data:; style-src 'unsafe-inline' ${cspSource}; script-src 'unsafe-inline' ${cspSource};" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Authrator</title>
<style>
  :root {
    --vscode-purple: #8B5CF6;
    --vscode-purple-hover: #7C3AED;
    --vscode-purple-light: rgba(139, 92, 246, 0.1);
    --accent: var(--vscode-focusBorder, #8B5CF6);
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    padding: 0;
    margin: 0;
    height: 100%;
    overflow: hidden;
  }

  body {
    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    font-size: var(--vscode-font-size, 13px);
    color: var(--vscode-foreground);
    background: transparent;
  }

  .container {
    padding: 20px 16px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .logo-container {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: var(--vscode-purple-light);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .logo-container img {
    width: 26px;
    height: 26px;
  }

  .header-text {
    flex: 1;
    min-width: 0;
  }

  .header-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 2px 0;
    color: var(--vscode-foreground);
  }

  .header-subtitle {
    font-size: 12px;
    margin: 0;
    color: var(--vscode-descriptionForeground);
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .welcome-card {
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
    padding: 16px;
  }

  .welcome-title {
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: var(--vscode-foreground);
  }

  .welcome-text {
    font-size: 12px;
    line-height: 1.5;
    margin: 0 0 16px 0;
    color: var(--vscode-descriptionForeground);
  }

  .btn-primary {
    width: 100%;
    background: var(--vscode-button-background, var(--vscode-purple));
    color: var(--vscode-button-foreground, #ffffff);
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
    transition: background-color 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .btn-primary:hover {
    background: var(--vscode-button-hoverBackground, var(--vscode-purple-hover));
  }

  .btn-primary:active {
    transform: scale(0.98);
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .feature-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
  }

  .feature-icon {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    background: var(--vscode-purple-light);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .feature-icon::before {
    content: '✓';
    color: var(--vscode-purple);
    font-size: 11px;
    font-weight: bold;
  }

  .divider {
    height: 1px;
    background: var(--vscode-panel-border);
    margin: 8px 0;
  }

  @media (max-width: 300px) {
    .header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <img src="${logo}" alt="Authrator" />
      </div>
      <div class="header-text">
        <h1 class="header-title">Authrator</h1>
        <p class="header-subtitle">API Client for VS Code</p>
      </div>
    </div>

    <div class="content">
      <div class="welcome-card">
        <h2 class="welcome-title">Welcome to Authrator</h2>
        <p class="welcome-text">
          A powerful API testing tool integrated directly into your editor.
        </p>
        <button class="btn-primary" id="openDashboard">
          <span>Open Dashboard</span>
          <span style="font-size: 14px;">→</span>
        </button>
      </div>

      <div class="features">
        <div class="feature-item">
          <div class="feature-icon"></div>
          <span>Test REST APIs quickly</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon"></div>
          <span>Save and organize requests</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon"></div>
          <span>Built-in authentication</span>
        </div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('openDashboard').addEventListener('click', () => {
      vscode.postMessage({ action: 'openDashboard' });
    });
  </script>
</body>
</html>`;
  }
}