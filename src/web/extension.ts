// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ThemeParser } from './themeParser';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "wordle-themes" is now active in the web extension host!');
	const themeParser: ThemeParser = new ThemeParser();

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const chooseThemeDisposable = vscode.commands.registerCommand('wordle-themes.chooseTheme', async() => {
		// The code you place here will be executed every time your command is executed

		// Open a quickpick with all theme options
		const themeNames = themeParser.getThemeNames();
		const themeName = await vscode.window.showQuickPick(themeNames);
		if (themeName) {
			themeParser.changeTheme(themeName);
		}
	});

	const resetThemeDisposable = vscode.commands.registerCommand('wordle-themes.resetThemeMemory', () => {
		themeParser.resetThemeMemory();
	});

	// We watch the config for changes and reload the themes list whenever the theme config changes
	const themeDisposable = vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('wordlethemes.themes')) {
			themeParser.loadThemes();
		}
	});
	context.subscriptions.push(themeDisposable);

	context.subscriptions.push(chooseThemeDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
