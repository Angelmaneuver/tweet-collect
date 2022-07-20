import {
	TwitterApi,
	TwitterApiv2,
	TweetV2,
} from 'twitter-api-v2';

export class Twitter {
	private _api:       TwitterApi;
	private _converter: Tweet2Record;

	constructor(bearerToken: string) {
		this._api       = new TwitterApi(bearerToken);
		this._converter = new Tweet2Record();
	}

	public get api(): TwitterApiv2 {
		return this._api.v2;
	}

	public get converter(): Tweet2Record {
		return this._converter;
	}
}

export class Tweet2Record {
	private _record: Record<string, unknown> = {};

	public run(tweet: TweetV2): Record<string, unknown> {
		this._record = {};

		this.convert(tweet);

		return this._record;
	}

	private convert(record: any, pre?: string): void {
		for (const key in record) {
			const keyword = pre ? `${pre}.${key}` : key;
			const value   = Reflect.get(record, key);

			if ('object' === typeof(value) && !Array.isArray(value)) {
				this.convert(value, key);
			} else if ('object' === typeof(value) && Array.isArray(value)) {
				this._record[keyword] = value.toString();
			} else {
				this._record[keyword] = value;
			}
		}
	}
}
