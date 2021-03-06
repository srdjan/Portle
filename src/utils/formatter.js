import tickers from '../data/tickers.json';

class Formatter {
	static formatAddress(address) {
		if (!address) {
			return '';
		}
		const ellipsizedAddress = `${address.substr(0, 8)}…${address.substr(36)}`;
		return ellipsizedAddress;
	}

	static formatAsset(id) {
		const ticker = tickers[id];
		return ticker;
	}

	static formatProtocol(protocolId) {
		const protocolMap = {
			'compound': 'Compound',
			'dydx': 'dYdX',
			'fulcrum': 'Fulcrum',
			'maker': 'Maker DSR',
			'uniswap': 'Uniswap',
			'tokensets': 'TokenSets',
			'melon': 'Melon',
		};
		const protocol = protocolMap[protocolId];
		return protocol;
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

	static formatUniswapPool(poolId) {
		const assets = poolId.split('_');
		return `(${assets[0].toUpperCase()} + ${assets[1].toUpperCase()})`;
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
			'ethbtcrsi7030': 'ETHBTCRSI7030',
			'ethdai': 'ETHHIVOL',
			'ethemaapy': 'ETHEMAAPY',
			'ethmacoapy': 'ETHMACOAPY',
			'ethminvol': 'ETHMINVOL',
			'ethrsi6040': 'ETHRSI6040',
			'ethrsiapy': 'ETHRSIAPY',
			'ieth20smaco': 'iETH20SMACO',
			'ieth50smaco': 'iETH50SMACO',
			'stbtcdai': 'BTCLOVOL',
			'stethdai': 'ETHLOVOL',
		};
		return sets[setId];
	}

	static formatSetName(setId) {
		const sets = {
			'btcdai': 'BTC Range Bound High Volatility',
			'btceth2575': 'ETH BTC 75%/25% Weight',
			'btceth5050': 'BTC ETH Equal Weight',
			'btceth7525': 'BTC ETH 75%/25% Weight',
			'btcminvol': 'BTC Range Bound Min Volatility',
			'eth12emaco': 'ETH 12 Day EMA Crossover',
			'eth20smaco': 'ETH 20 Day Moving Average Crossover',
			'eth26emaco': 'ETH 26 Day EMA Crossover',
			'eth50smaco': 'ETH 50 Day Moving Average Crossover',
			'ethbtc26emaco': 'ETH/BTC EMA Ratio Trading',
			'ethbtcrsi7030': 'ETH/BTC RSI Ratio Trading',
			'ethdai': 'ETH Range Bound High Volatility',
			'ethemaapy': 'ETH 26 EMA Crossover Yield Set',
			'ethmacoapy': 'ETH 20 Day MA Crossover Yield Set',
			'ethminvol': 'ETH Range Bound Min Volatility',
			'ethrsi6040': 'ETH RSI 60/40 Crossover',
			'ethrsiapy': 'ETH RSI 60/40 Yield Set',
			'ieth20smaco': 'Inverse ETH 20 Day MA Crossover',
			'ieth50smaco': 'Inverse ETH 50 Day MA Crossover',
			'stbtcdai': 'BTC Range Bound Low Volatility',
			'stethdai': 'ETH Range Bound Low Volatility',
		};
		return sets[setId];
	}
}

export default Formatter;
