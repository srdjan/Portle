import { ethers } from 'ethers';
import EthCall from 'ethcall';

import Converter from './converter.js';

import erc20Abi from '../data/abi/erc20.json';

import tokenAddresses from '../data/addresses.json';

class Loader {
	static async loadPrices(assets) {
		const assetString = assets.join('%2C');
		const url = `https://api.portle.io/price?assets=${assetString}`;
		const response = await fetch(url);
		const prices = await response.json();
		return prices; 
	}

	static async loadAssets(addresses) {
		const addressCount = addresses.length;
		const amberdataKey = 'UAKcba96395cf4b76e0d532cbae62a2bf6e';
		const headers = {
			'x-api-key': amberdataKey,
		};
		const balancePromises = [];
		for (const address of addresses) {
			const url = `https://web3api.io/api/v2/addresses/${address}/tokens`;
			const balancePromise = fetch(url, {
				headers,
			});
			balancePromises.push(balancePromise);
		}
		const balanceResponses = await Promise.all(balancePromises);
		const jsonPromises = [];
		for (const balanceResponse of balanceResponses) {
			const jsonPromise = balanceResponse.json();
			jsonPromises.push(jsonPromise);
		}
		const balanceJson = await Promise.all(jsonPromises);
		const balances = {};
		for (const address of addresses) {
			balances[address] = {};
		}
		const addressMap = Converter.reverseMap(tokenAddresses);
		for (let i = 0; i < addressCount; i++) {
			const json = balanceJson[i];
			const address = addresses[i];
			const tokens = json.payload.records;
			for (const tokenData of tokens) {
				const assetAddress = ethers.utils.getAddress(tokenData.address);
				if (!assetAddress) {
					continue;
				}
				const assetId = addressMap[assetAddress];
				if (!assetId) {
					continue;
				}
				const balance = tokenData.amount;
				balances[address][assetId] = balance;
			}
		}

		const provider = getProvider();
		const wethContract = new EthCall.Contract(tokenAddresses['weth'], erc20Abi);
		const amplContract = new EthCall.Contract(tokenAddresses['ampl'], erc20Abi);

		const calls = [];
		for (let i = 0; i < addressCount; i++) {
			const address = addresses[i];
			const ethBalanceCall = EthCall.calls.getEthBalance(address);
			const wethBalanceCall = wethContract.balanceOf(address);
			const amplBalanceCall = amplContract.balanceOf(address);
			calls.push(ethBalanceCall);
			calls.push(wethBalanceCall);
			calls.push(amplBalanceCall);
		}

		const balanceData = await EthCall.all(calls, provider);
		for (let i = 0; i < addressCount; i++) {
			const address = addresses[i];
			balances[address]['eth'] = balanceData[3 * i].toString();
			balances[address]['weth'] = balanceData[3 * i + 1].toString();
			balances[address]['ampl'] = balanceData[3 * i + 2].toString();
		}
		return balances;
	}

	static async loadCompound(addresses) {
		const url = 'https://api.thegraph.com/subgraphs/name/destiner/compound';
		const addressQuery = addresses
			.map(address => { return `
				user_${address}: user(id: "${address}") {
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
			`;})
			.join('');
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
				${addressQuery}
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

	static async loadDydx(addresses) {
		const url = 'https://api.thegraph.com/subgraphs/name/destiner/dydx';
		const addressQuery = addresses
			.map(address => { return `
				user_${address}: user(id: "${address}") {
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
			`;})
			.join('');
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
				${addressQuery}
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

	static async loadFulcrum(addresses) {
		const url = 'https://api.thegraph.com/subgraphs/name/destiner/fulcrum';
		const addressQuery = addresses
			.map(address => { return `
				user_${address}: user(id: "${address}") {
					balances {
						token {
							symbol
							supplyIndex
							supplyRate
							underlying {
								address
							}
						}
						balance
					}
				}
			`;})
			.join('');
		const query = `
			query {
				iTokens {
					symbol
					address
					supplyIndex
					supplyRate
					underlying {
						address
					}
				}
				${addressQuery}
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

	static async loadMaker(addresses) {
		const url = 'https://api.thegraph.com/subgraphs/name/destiner/maker';
		const addressQuery = addresses
			.map(address => { return `
				user_${address}: user(id: "${address}") {
					id
					balance
					chaiBalance
					proxy {
						id
						balance
					}
				}
			`;})
			.join('');
		const query = `
			query {
				maker(id: 0) {
					index
					rate
				}
				${addressQuery}
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
