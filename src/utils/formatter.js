import BigNumber from 'bignumber.js';

import tickers from '../data/tickers.json';

class Formatter {
	static formatAddress(address) {
		if (!address) {
			return '';
		}
		const ellipsizedAddress = `${address.substr(0, 6)}…${address.substr(38)}`;
		return ellipsizedAddress;
	}

	static formatAsset(id) {
		const ticker = tickers[id];
		return ticker;
	}

	static formatPlatform(platformId) {
		const platformMap = {
			'compound': 'Compound',
			'dydx': 'dYdX',
			'fulcrum': 'Fulcrum',
		};
		const platform = platformMap[platformId];
		return platform;
	}

	static formatAmount(amountString) {
		const amount = new BigNumber(amountString);
		return `${amount.toFixed(2)}`;
	}

	static formatMoney(priceString) {
		const price = new BigNumber(priceString);
		return `$${price.toFixed(2)}`;
	}

	static formatRate(rateString) {
		if (!rateString) {
			return '…';
		}
		const rate = new BigNumber(rateString);
		return `${(rate * 100).toFixed(2)}%`;
	}
}

export default Formatter;
