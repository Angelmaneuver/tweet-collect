import { window, workspace }      from 'vscode';
import {
	TweetV2,
	UserV2,
	MediaObjectV2,
	TweetSearchRecentV2Paginator,
}                                 from 'twitter-api-v2';
import { BaseGuideEnd }           from './end';
import { Optional }               from '../../utils/base/optional';

const mediaKeysId     = 'attachments.media_keys';
const startsWithUser  = 'user.';
const startsWithMedia = 'media.';
const newLineMatcher  = /\r?\n/g;

export abstract class AbstractTweetAccessGuideEnd extends BaseGuideEnd {
	private users:  UserV2[]        = [];
	private medias: MediaObjectV2[] = [];

	protected async after(): Promise<void> {
		window.showInformationMessage(this.message);
		this.collect();
	}

	protected abstract get message(): string;

	protected abstract get tweets(): Promise<TweetSearchRecentV2Paginator>;

	protected async collect(): Promise<void> {
		let   tweets = await this.tweets;
		const data   = [`${this.settings.enclosure}${this.settings.dataLayout.join(this.settings.enclosure + this.settings.separator + this.settings.enclosure)}${this.settings.enclosure}`];

		this.users   = tweets.includes.users;
		this.medias  = tweets.includes.media;

		for (const tweet of tweets) {
			data.push(this.tweet2csvString(tweet));
		}

		while(!tweets.done) {
			tweets = await tweets.next();

			this.users   = tweets.includes.users;
			this.medias  = tweets.includes.media;
	
			for (const tweet of tweets) {
				data.push(this.tweet2csvString(tweet));
			}
		}

		workspace.openTextDocument({ content: data.join(this.settings.eol) })
		.then((value) => { window.showTextDocument(value); });
	}

	protected tweet2csvString(tweet: TweetV2): string {
		const record = this.twitter.converter.run(tweet);
		const temp   = [];

		for (const key of this.settings.dataLayout) {
			temp.push(`${this.settings.enclosure}${this.getItemValue(key, record)}${this.settings.enclosure}`);
		}

		return temp.join(this.settings.separator);
	}

	protected getItemValue(key: string, record: Record<string, unknown>): unknown {
		let value: any = '';

		if (key.startsWith(startsWithUser, 0)) {
			const user = this.users.find((v) => { return record['author_id'] === v.id; });
			value      = Reflect.get(Optional.ofNullable(user).orElseThrow(new ReferenceError(`author_id "${record['author_id']}" is not found...`)), key.replace(startsWithUser, ''));
		} else if (key.startsWith(startsWithMedia, 0)) {
			if (mediaKeysId in record) {
				const mediaData = [];
				const mediakeys = (record[mediaKeysId] as string).split(',');

				for (const mediaKey of mediakeys) {
					const media =  this.medias.find((v) => { return mediaKey === v.media_key; });
					mediaData.push(Reflect.get(Optional.ofNullable(media).orElseThrow(new ReferenceError(`media_key "${mediaKey}" is not found...`)), key.replace(startsWithMedia, '')));
				}

				value = mediaData.join(',');
			}
		} else {
			value = key in record ? record[key] : '';
		}

		if ('string' === typeof(value) && this.settings.newLine2space) {
			value = value.replace(newLineMatcher, '');
		}

		return value;
	}
}
