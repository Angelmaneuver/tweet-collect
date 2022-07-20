import { commands, ExtensionContext } from 'vscode';
import { start }                      from './includes/kickstarter';

export function activate(context: ExtensionContext): void {
	context.subscriptions.push(
		commands.registerCommand("tweet-collect.guidance", () => {
			start(context);
		})
	);
}

export function deactivate():void {}
