import { AbstractMenuGuide } from './abc';
import { VSCodePreset }      from '../../utils/base/vscodePreset';

const items = {
	search: VSCodePreset.create(VSCodePreset.icons.search, 'Search', 'Search for Tweet.'),
};

export class MenuGuide extends AbstractMenuGuide {
	public init(): void {
		super.init();

		this.placeholder = 'Select the item you want to do.';
		this.items       = [items.search].concat(
			this.items
		);
	}

	protected getExecute(label: string | undefined): (() => Promise<void>) | undefined {
		switch (label) {
			case items.search.label:
				return async () => {
					this.setNextSteps([{
						key:   'QueryInputGuide',
						state: this.createBaseState(' - Search', 'search', 2),
					},{
						key:   'ConditionSelectGuide'
					},{
						key:   'SearchGuideEnd'
					}]);
				};
			default:
				return super.getExecute(label);
		}
	}
}
