import { window, workspace, QuickPickItem } from 'vscode';
import {
	TweetSearchRecentV2Paginator,
}                                           from 'twitter-api-v2';
import { BaseInputGuide }                   from './base/input';
import { AbstractQuickPickGuide }           from './base/pick';
import { AbstractTweetAccessGuideEnd }      from './base/tweet';
import { BaseValidator }                    from './validator/base';
import { VSCodePreset }                     from '../utils/base/vscodePreset';

export class QueryInputGuide extends BaseInputGuide {
	public init(): void {
		super.init();

		this.itemId   = 'query';
		this.prompt   = 'Enter a query to search for Tweet.';
		this.validate = BaseValidator.validateRequired;
	}
}

const templateConditionItems: Record<string, QuickPickItem> = {
	retweetExclude: VSCodePreset.create(VSCodePreset.icons.filter, 'Exclude Retweet', 'Exclude retweets.'),
} as const;

const optionConditions: Record<string, string>              = {
	retweetExclude: '-is:retweet',
} as const;

export class ConditionSelectGuide extends AbstractQuickPickGuide {
	public init(): void {
		super.init();

		this.itemId        = 'condition';
		this.items         = [
			templateConditionItems.retweetExclude,
		];
		this.activeItem    = this.items;
		this.placeholder   = 'Please select any additional search options you would like to add.';
		this.canSelectMany = true;
	}

}

export class SearchGuideEnd extends AbstractTweetAccessGuideEnd {
	protected get message(): string {
		return 'Search started. The editor will open upon completion.';
	};

	protected get tweets(): Promise<TweetSearchRecentV2Paginator> {
		return this.twitter.api.search(this.query, this.settings.options);
	};

	private get query(): string {
		const query   = this.guideGroupResultSet['query'] as string;
		const keys    = Object.keys(templateConditionItems);
		const options = this.guideGroupResultSet['condition'] as Array<QuickPickItem>;
		let   option  = '';

		for(const item of options) {
			const condition = keys.find((key) => { return templateConditionItems[key] === item; });

			if (condition) {
				option += ` ${optionConditions[condition]}`;
			}
		}

		return `${query} ${option}`;
	}
}
