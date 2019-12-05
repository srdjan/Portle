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
			'maker': 'Maker DSR',
			'uniswap': 'Uniswap',
			'tokensets': 'TokenSets',
		};
		const platform = platformMap[platformId];
		return platform;
	}

	static formatAmount(amountString) {
		const amount = new Number(amountString);
		const options = {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
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

	static formatSet(setId) {
		const sets = {
			'btcdai': 'BTCHIVOL',
			'btceth2575': 'BTCETH2575',
			'btceth5050': 'BTCETH5050',
			'btceth7525': 'BTCETH7525',
			'btcminvol': 'BTCMINVOL',
			'eth12emaco': 'ETH12EMACO',
			'eth20smaco': 'ETH20SMACO',
			'eth26emaco': 'ETH26EMACO',
			'eth50smaco': 'ETH50SMACO',
			'ethbtc26emaco': 'ETHBTCEMACO',
			'ethdai': 'ETHHIVOL',
			'ethminvol': 'ETHMINVOL',
			'ethrsi6040': 'ETHRSI6040',
			'ethbtcrsi7030': 'ETHBTCRSI7030',
			'ieth20smaco': 'iETH20SMACO',
			'ieth50smaco': 'iETH50SMACO',
			'stbtcdai': 'BTCLOVOL',
			'stethdai': 'ETHLOVOL',
		};
		return sets[setId];
	}
}

export default Formatter;
