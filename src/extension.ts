import * as vscode from 'vscode';
import { AuthService } from './services/authService';
import { ApiService } from './services/apiService';
import { LocalStore } from './services/localStore';
import { openDashboardPanel } from './webviews/dashboardPanel';
// import { ExplorerViewProvider } from './views/explorerView';

export async function activate(context: vscode.ExtensionContext) {
  await vscode.workspace.fs.createDirectory(context.globalStorageUri);

  const authService = new AuthService(context);
  const apiService = new ApiService();
  const localStore = new LocalStore(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('authrator.open', async () => {
      openDashboardPanel(context, authService, apiService, localStore);
    })
  );

  // Temporarily disabled - focus on dashboard panel
  // const provider = new ExplorerViewProvider(context, authService, apiService, localStore);
  // context.subscriptions.push(
  //   vscode.window.registerWebviewViewProvider(ExplorerViewProvider.viewId, provider)
  // );
}

export function deactivate() {}
