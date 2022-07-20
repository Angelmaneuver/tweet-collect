import { AbstractGuide  }              from '../base/abc';
import { AbstractTweetAccessGuideEnd } from '../base/tweet';
import { BaseInputGuide }              from '../base/input';
import { BaseConfirmGuide }            from '../confirm';
import { MenuGuide }                   from '../menu/menu';
import {
	QueryInputGuide,
	ConditionSelectGuide,
	SearchGuideEnd,
}                                      from '../search';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Constructable<T> extends Function { new (...args: Array<any>): T; }

export abstract class GuideFactory {
	private static guides: Record<string, Constructable<AbstractGuide | AbstractTweetAccessGuideEnd>> = {};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static create(className: string, ...args: Array<any>): AbstractGuide {
		if (0 === Object.keys(this.guides).length) {
			this.init();
		}

		const guideName = Object.keys(this.guides).find(guide => guide === className);

		if (guideName) {
			return new this.guides[guideName](...args);
		} else {
			throw new ReferenceError('Requested ' + className + ' class not found...');
		}
	}

	private static init(): void {
		/* eslint-disable @typescript-eslint/naming-convention */
		this.guides = {
			MenuGuide:            MenuGuide,
			BaseInputGuide:       BaseInputGuide,
			BaseConfirmGuide:     BaseConfirmGuide,
			QueryInputGuide:      QueryInputGuide,
			ConditionSelectGuide: ConditionSelectGuide,
			SearchGuideEnd:       SearchGuideEnd,
		};
		/* eslint-enable @typescript-eslint/naming-convention */
	}
}
