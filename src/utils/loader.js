import Converter from './converter.js';

import coinIds from '../data/coin-ids.json';

class Loader {
	static async loadPrice(assets) {
		const assetIds = assets.map((asset) => coinIds[asset]);
		const assetIdString = assetIds.join('%2C');
		const url = `https://api.coingecko.com/api/v3/simple/price?ids=${assetIdString}&vs_currencies=usd`;
		const response = await fetch(url);
		const prices = await response.json();
		const usdPrices = assetIds.map((assetId) => prices[assetId].usd);
		return usdPrices; 
	}

	static async loadBalance(address) {
		const url = `https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`;
		const response = await fetch(url);
		const balanceResponse = await response.json();
		const balances = {};
		balances['eth'] = {
			balance: Converter.toBalance(balanceResponse.ETH.balance, 'eth'),
		};
		const tokens = balanceResponse.tokens || [];
		for (const tokenData of balanceResponse.tokens) {
			const assetId = tokenData.tokenInfo.symbol.toLowerCase();
			if (assetId == '') {
				continue;
			}
			const balance = tokenData.balance.toString();
			const price = tokenData.tokenInfo.price
				? tokenData.tokenInfo.price.rate
				: undefined;
			balances[assetId] = {
				balance,
				price,
			};
		}
		return balances;
	}

	static async loadCompound(address) {
		const url = 'https://api.thegraph.com/subgraphs/name/destiner/compound';
		const query = `
			query {
				tokens {
					symbol
					address
					supplyRate
					supplyIndex
				}
				userBalances(where: {
					id: "${address}"
				}) {
					balances {
						token {
							symbol
							supplyRate
							supplyIndex
						}
						balance
					}
				}
			}`;
		const opts = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query }),
		};
		const response = await fetch(url, opts);
		const json = await response.json();
		const data = json.data;
		return data;
	}

	static async loadDydx(address) {
		const url = 'https://api.thegraph.com/subgraphs/name/destiner/dydx';
		const query = `
			query {
				markets {
					token {
						id
						symbol
					}
					supplyIndex
					supplyRate
				}
				users(where: {
					id: "${address}"
				}) {
					balances {
						balance
						market {
							token {
								symbol
							}
							supplyIndex
							supplyRate
						}
					}
				}
			}`;
		const opts = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query })
		};
		const response = await fetch(url, opts);
		const json = await response.json();
		const data = json.data;
		return data;
	}

	static async loadFulcrum(address) {
		const url = 'https://api.thegraph.com/subgraphs/name/destiner/fulcrum';
		const query = `
			query {
				tokens {
					symbol
					address
					index
					supplyRate
				}
				userBalances(where: {
					id: "${address}"
				}) {
					balances {
						token {
							symbol
							index
							supplyRate
						}
						balance
					}
				}
			}`;
		const opts = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query })
		};
		const response = await fetch(url, opts);
		const json = await response.json();
		const data = json.data;
		return data;
	}
}

export default Loader;
