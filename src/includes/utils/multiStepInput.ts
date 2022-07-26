import {
	window,
	Disposable,
	QuickInput,
	QuickInputButton,
	QuickInputButtons,
	QuickPickItem,
} from 'vscode';

export type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface InputBoxParameters {
	title:        string;
	step:         number;
	totalSteps:   number;
	value:        string;
	prompt:       string;
	validate:     (value: string) => Promise<string | undefined>;
	buttons?:     QuickInputButton[];
	shouldResume: () => Thenable<boolean>;
}

interface QuickPickParameters<T extends QuickPickItem> {
	title:          string;
	step:           number;
	totalSteps:     number;
	items:          T[];
	activeItem?:    T | readonly T[];
	placeholder:    string;
	buttons?:       QuickInputButton[];
	shouldResume:   () => Thenable<boolean>;
	canSelectMany?: boolean;
}

export class InputFlowAction extends Error {
	static back   = new InputFlowAction();
	static cancel = new InputFlowAction();
	static resume = new InputFlowAction();
}

export class MultiStepInput {
	static async run(start: InputStep): Promise<void> {
		return new MultiStepInput().stepThrough(start);
	}

	private current?: QuickInput;
	private steps:    InputStep[] = [];

	private async stepThrough(start: InputStep) {
		let step: InputStep | void = start;

		while (step) {
			this.steps.push(step);

			if (this.current) {
				this.inputActivation(this.current, false);
			}

			try {
				step = await step(this);
			} catch (error) {
				if (error instanceof Error) {
					step = this.errorHandle(error);
				}
			}
		}

		this.dispose();
	}

	async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>(
		{ title, step, totalSteps, items, activeItem, placeholder, buttons, shouldResume, canSelectMany }: P
	): Promise<T | readonly T[] | (P extends { buttons: (infer I)[]; } ? I : never)> {
		const disposable: Disposable[] = [];

		try {
			return await new Promise<T | readonly T[] | (P extends { buttons: (infer I)[] } ? I : never)>(
				(resolve, reject) => {
					const input         = window.createQuickPick<T>();
					input.title         = title;
					input.step          = step;
					input.totalSteps    = totalSteps;
					input.items         = items;
					input.placeholder   = placeholder;
					input.buttons       = this.createButtons(buttons);
					input.canSelectMany = canSelectMany? canSelectMany : false;

					if (activeItem) {
						const activeItems   = Array.isArray(activeItem) ? activeItem : [activeItem];

						input.activeItems   = activeItems;
						input.selectedItems = activeItems;
					}

					disposable.push(
						input.onDidTriggerButton((item) => {
							if (item === QuickInputButtons.Back) {
								reject(InputFlowAction.back);
							} else {
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								resolve(<any>item);
							}
						}),
						input.onDidAccept(
							input.canSelectMany
								? async () => { resolve(input.selectedItems); }
								: async () => { return; }
						),
						input.onDidChangeSelection(
							input.canSelectMany
								? (items) => { return; }
								: (items) => { resolve(items[0]); }
						),
						input.onDidHide(() => {(async () => {
							reject(
								shouldResume && (await shouldResume())
									? InputFlowAction.resume
									: InputFlowAction.cancel
							);
						})().catch(reject);})
					);

					this.dispose();
					this.current      = input;
					this.current.show();
				}
			);
		} finally {
			disposable.forEach((d) => d.dispose());
		}
	}

	async showInputBox<P extends InputBoxParameters>(
		{ title, step, totalSteps, value, prompt, validate, buttons, shouldResume }: P
	): Promise<string | (P extends { buttons: (infer I)[]; } ? I : never)> {
		const disposable: Disposable[] = [];

		try {
			return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>(
				(resolve, reject) => {
					const input      = window.createInputBox();
					input.title      = title;
					input.step       = step;
					input.totalSteps = totalSteps;
					input.value      = value || '';
					input.prompt     = prompt;
					input.buttons    = this.createButtons(buttons);

					let validating   = validate('');

					disposable.push(
						input.onDidTriggerButton((item) => {
							if (item === QuickInputButtons.Back) {
								reject(InputFlowAction.back);
							} else {
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								resolve(<any>item);
							}
						}),
						input.onDidAccept(
							async () => {
								const value = input.value;
								this.inputActivation(input, false);
								
								if (!(await validate(value))) {
									resolve(value);
								}
								
								this.inputActivation(input, true);
							}
						),
						input.onDidChangeValue(
							async (text) => {
								const current           = validate(text);
								validating              = current;
								const validationMessage = await current;

								if (current === validating) {
									input.validationMessage = validationMessage;
								}
							}
						),
						input.onDidHide(
							() => { (async () => {
								reject(
									shouldResume && (await shouldResume())
										? InputFlowAction.resume
										: InputFlowAction.cancel
								);
							})().catch(reject);}
						)
					);

					this.dispose();
					this.current = input;
					this.current.show();
				}
			);
		} finally {
			disposable.forEach((d) => d.dispose());
		}
	}

	private errorHandle(error: Error) {
		if (error === InputFlowAction.back) {
			this.steps.pop();
			return this.steps.pop();
		} else if (error === InputFlowAction.resume) {
			return this.steps.pop();
		} else if (error === InputFlowAction.cancel) {
			return undefined;
		} else {
			throw error;
		}
	}

	private inputActivation(input: QuickInput, valid: boolean): void {
		input.enabled = valid;
		input.busy    = !valid;
	}

	private dispose(): void {
		if (this.current) {
			this.current.dispose();
		}
	}

	private createButtons(buttons: QuickInputButton[] | undefined) {
		return [
			...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
			...(buttons || []),
		];
	}
}
