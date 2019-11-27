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
			'maker': 'MakerDAO',
			'uniswap': 'Uniswap',
		};
		const platform = platformMap[platformId];
		return platform;
	}

	static formatAmount(amountString, decimals = 2) {
		const amount = new Number(amountString);
		const options = {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		};
		return amount.toLocaleString(undefined, options);
	}

	static formatMoney(priceString) {
		const amount = new Number(priceString);
		const options = {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
			style: 'currency',
			currency: 'USD',
		};
		return amount.toLocaleString(undefined, options);
	}

	static formatRate(rateString) {
		if (!rateString) {
			return '…';
		}
		const rate = new Number(rateString);
		const options = {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
			style: 'percent',
		};
		return rate.toLocaleString(undefined, options);
	}
}

export default Formatter;
