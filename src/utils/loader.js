import { ethers } from 'ethers';

import Converter from './converter.js';

import tokenOracleAbi from '../data/abi/tokenOracle.json';

import addresses from '../data/addresses.json';

class Loader {
	static async loadPrice(assets) {
		const assetString = assets.join('%2C');
		const url = `https://api.portle.io/price?assets=${assetString}`;
		const response = await fetch(url);
		const prices = await response.json();
		return prices; 
	}

	static async loadBalance(address) {
		const url = `https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`;
		const response = await fetch(url);
		const balanceResponse = await response.json();
		const balances = {};
		balances['eth'] = {
			balance: Converter.toBalance(balanceResponse.ETH.balance, 'eth'),
		};
		const addressMap = Converter.reverseMap(addresses);
		const tokens = balanceResponse.tokens || [];
		for (const tokenData of tokens) {
			const assetAddress = ethers.utils.getAddress(tokenData.tokenInfo.address);
			if (!assetAddress) {
				continue;
			}
			const assetId = addressMap[assetAddress];
			if (!assetId) {
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

		const provider = getProvider();
		const tokenOracleAddress = '0x66c7C9E4075b1ff9D35693973432A20632Ba93e6';
		const tokenOracle = new ethers.Contract(tokenOracleAddress, tokenOracleAbi, provider);
		const balanceRequest = [{
			token: addresses['weth'],
		}, {
			token: addresses['ampl'],
		}];
		const oracleResponse = await tokenOracle.balances(address, balanceRequest);
		balances['weth'] = {
			balance: oracleResponse[0].toString(),
		};
		balances['ampl'] = {
			balance: oracleResponse[1].toString(),
		};

		return balances;
	}

	static async loadCompound(address) {
		const url = 'https://api.thegraph.com/subgraphs/name/destiner/compound';
		const query = `
			query {
				cTokens {
					symbol
					address
					supplyRate
					supplyIndex
					underlying {
						address
					}
				}
				userBalances(where: {
					id: "${address}"
				}) {
					balances {
						token {
							supplyRate
							supplyIndex
							underlying {
								address
							}
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
						address
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
								address
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
			body: JSON.stringify({ query }),
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
				iTokens {
					symbol
					address
					index
					supplyRate
					underlying {
						address
					}
				}
				userBalances(where: {
					id: "${address}"
				}) {
					balances {
						token {
							symbol
							index
							supplyRate
							underlying {
								address
							}
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

	static async loadMaker(address) {
		const url = 'https://api.thegraph.com/subgraphs/name/destiner/maker';
		const query = `
			query {
				users(where: {
					id: "${address}"
				}) {
					id
					balance
					chaiBalance
					proxy {
						id
						balance
					}
				}
				maker(id: 0) {
					index
					rate
				}
			}
		`;
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

	static async loadUniswap(address) {
		const url = 'https://api.thegraph.com/subgraphs/name/graphprotocol/uniswap';
		const query = `
			query {
				userExchangeDatas(where: {
					userAddress: "${address}",
					uniTokenBalance_gt: 0
				}) {
					uniTokenBalance
					exchange {
						id
						tokenAddress
						totalUniToken
						ethBalance
						tokenBalance
					}
				}
			}
		`;
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

	static async loadTokenSets(address) {
		const url = 'https://api.thegraph.com/subgraphs/name/destiner/token-sets';
		const query = `
			query {
				users(where: {
					id: "${address}"
				}) {
					balances {
						balance
						set_ {
							set_ {
								symbol
								units
								naturalUnit
							}
							underlyingSet {
								components
								units
								naturalUnit
							}
						}
					}
				}
			}
		`;
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

	static async loadMelon(address) {
		const url = 'https://api.thegraph.com/subgraphs/name/melonproject/melon';
		const query = `
			query {
				investor(id: "${address}") {
					id
					investments {
						shares
						fund {
							name
							totalSupply
							holdingsHistory(orderBy: timestamp, orderDirection: desc) {
								timestamp
								amount
								assetGav
								asset {
									id
									symbol
									decimals
								}
							}
						}
					}
				}
			}
		`;
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
}

function getProvider() {
	const web3Endpoint = 'https://mainnet.infura.io/v3/93e3393c76ed4e1f940d0266e2fdbda2';
	const provider = new ethers.providers.JsonRpcProvider(web3Endpoint);
	return provider;
}

export default Loader;
