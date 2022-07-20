import { window, ExtensionContext } from 'vscode';
import { MultiStepInput }           from './utils/multiStepInput';
import { State }                    from './guide/base/base';
import { GuideFactory }             from './guide/factory/base';

export async function start(context: ExtensionContext): Promise<void> {
	const state = { title: `Tweet Collector`, resultSet: {} } as Partial<State>;

	try {
		const menu = GuideFactory.create('MenuGuide', state, context);
		await MultiStepInput.run((input: MultiStepInput) => menu.start(input));
	} catch (e) {
		errorHandling(e);
	}

	if (present(state.message)) {
		window.showInformationMessage(state.message as string);
	}
}

function present(value?: string): boolean {
	return (value && value.length > 0) ? true : false;
}

function errorHandling(e: unknown) {
	if (e instanceof Error) {
		window.showWarningMessage(e.message);
		console.debug(e);
	}
}
