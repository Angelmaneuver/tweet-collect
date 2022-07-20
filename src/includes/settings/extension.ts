import * as os                 from 'os';
import { ConfigurationTarget } from 'vscode';
import { Tweetv2SearchParams } from 'twitter-api-v2';
import { SettingBase }         from './base';

const ITEM_ID            = {
	bearerToken:   'bearerToken',
	expansions:    'expansions',
	maxResults:    'maxResults',
	tweetFields:   'tweetFields',
	mediaFields:   'mediaFields',
	dataLayout:    'dataLayout',
	enclosure:     'enclosure',
	separator:     'separator',
	eol:           'eol',
	newLine2space: 'newLine2space',
} as const;

const ITEM_ID_VALUE_LIST = Object.values(ITEM_ID) as Array<string>;

export class ExtensionSetting extends SettingBase {
	private _bearerToken:   string;
	private _dataLayout:    Array<string>;
	private _enclosure:     string;
	private _separator:     string;
	private _eol:           string;
	private _newLine2space: boolean;

	constructor() {
		super('tweet-collect', ConfigurationTarget.Global);

		this._bearerToken   = this.get(this.itemId.bearerToken)   as string;
		this._dataLayout    = this.get(this.itemId.dataLayout)    as Array<string>;
		this._enclosure     = this.get(this.itemId.enclosure)     as string;
		this._separator     = this.get(this.itemId.separator)     as string;
		this._eol           = this.getInitialValue();
		this._newLine2space = this.get(this.itemId.newLine2space) as boolean;
	}

	public get itemId() {
		return ITEM_ID;
	}

	public get itemIdValues() {
		return ITEM_ID_VALUE_LIST;
	}

	public get bearerToken(): string {
		return this._bearerToken;
	}

	public get dataLayout(): Array<string> {
		return this._dataLayout;
	}

	public get enclosure(): string {
		return this._enclosure;
	}

	public get separator(): string {
		return this._separator;
	}

	public get eol(): string {
		return this._eol;
	}

	public get newLine2space(): boolean {
		return this._newLine2space;
	}

	public get options(): Partial<Tweetv2SearchParams> {
		/* eslint-disable @typescript-eslint/naming-convention */
		return {
			"expansions":   this.get(this.itemId.expansions)  as Array<string>,
			"max_results":  this.get(this.itemId.maxResults)  as number,
			"tweet.fields": this.get(this.itemId.tweetFields) as Array<string>,
			"media.fields": this.get(this.itemId.mediaFields) as Array<string>,
		} as Partial<Tweetv2SearchParams>;
		/* eslint-enable @typescript-eslint/naming-convention */
	}

	public async uninstall(): Promise<void> {
		for (const id of this.itemIdValues) {
			await this.remove(id);
		}
	}

	private getInitialValue(): string {
		const eol = this.get(this.itemId.eol);

		return ('auto' === eol ? os.EOL : eol) as string;
	}
}
