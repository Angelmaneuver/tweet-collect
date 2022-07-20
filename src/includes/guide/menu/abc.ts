import { AbstractQuickPickSelectGuide } from '../base/pick';
import { VSCodePreset }                 from '../../utils/base/vscodePreset';

const items = {
	uninstall: VSCodePreset.create(VSCodePreset.icons.trashcan, 'Uninstall', 'Remove all parameters for this extension.'),
	exit:      VSCodePreset.create(VSCodePreset.icons.signOut,  'Exit',      'Exit this extension.'),
};

export abstract class AbstractMenuGuide extends AbstractQuickPickSelectGuide {
	public init(): void {
		super.init();

		this.items = this.items.concat([items.uninstall, items.exit]);
	}

	protected getExecute(label: string | undefined): (() => Promise<void>) | undefined {
		switch (label) {
			case items.uninstall.label:
				return this.uninstall();
			default:
				return undefined;
		}
	}

	private uninstall(): () => Promise<void> {
		return async () => {
			this.state.placeholder = 'Do you want to erase all settings related to this extension?';
			this.setNextSteps([{
				key:   'BaseConfirmGuide',
				state: { title: this.title },
				args:  [
					{ yes: 'Uninstall.', no: 'Back to previous.' },
					( async () => { this.settings.uninstall(); } )
				]
			}]);
		};
	}
}
