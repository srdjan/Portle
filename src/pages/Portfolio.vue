<template>
	<div id="view">
		<TotalBalance :assets="assetBalances" :deposits="depositBalances" :prices="prices"/>
		<div class="category-header">
			<h2>Assets</h2>
		</div>
		<AssetList :balances="assetBalances" :prices="prices"/>
		<div class="category-header">
			<h2>Deposits</h2>
			<img :src="plusCircleIcon" class="icon" @click="openDepositManagePage()" />
		</div>
		<DepositList :balances="depositBalances" :prices="prices" :rates="rates"/>
	</div>
</template>

<script>
import Vue from 'vue';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import addresses from '../data/addresses.json';
import coinIds from '../data/coin-ids.json';

import plusCircleIcon from '../../public/img/plus-circle.svg';

import TotalBalance from '../components/TotalBalance.vue';
import AssetList from '../components/group/AssetList.vue';
import DepositList from '../components/group/DepositList.vue';

export default {
	components: {
		TotalBalance,
		AssetList,
		DepositList,
	},
	data() {
		return {
			account: null,
			assetBalances: {},
			depositBalances: {
				compound: {},
				dydx: {},
				fulcrum: {},
			},
			prices: {},
			rates: {
				supply: {
					compound: {},
					dydx: {},
					fulcrum: {},
				},
				borrow: {
					compound: {},
					dydx: {},
					fulcrum: {},
				},
			},
		}
	},
	mounted() {
		this._loadAccount();
		if (!this.account) {
			this.$router.push('/login');
			return;
		}
		this._loadPrices();
		this._loadBalances();
		this._loadCompound();
		this._loadDydx();
		this._loadFulcrum();
	},
	methods: {
		openDepositManagePage() {
			const path = '/deposit/manage';
			this.$router.push(path);
		},
		_loadAccount() {
			const address = localStorage.getItem('address');
			const auth = localStorage.getItem('auth') == 'true';
			if (!address) {
				return;
			}
			this.account = {
				address,
				auth,
			};
		},
		async _loadPrices() {
			const assets = ['dai', 'usdc', 'eth', 'seth'];
			const assetIds = assets.map((asset) => coinIds[asset]);
			const assetIdString = assetIds.join('%2C');
			const url = `https://api.coingecko.com/api/v3/simple/price?ids=${assetIdString}&vs_currencies=usd`;
 			const response = await fetch(url);
			const prices = await response.json();
			for (let i = 0; i < assets.length; i++) {
				const assetId = assets[i];
				const coinId = assetIds[i];
				const price = prices[coinId].usd;
				Vue.set(this.prices, assetId, price);
			}
		},
		async _loadBalances() {
			const url = `https://api.ethplorer.io/getAddressInfo/${this.account.address}?apiKey=freekey`;
			const response = await fetch(url);
			const balance = await response.json();
			// ETH
			const etherBalance = balance.ETH.balance;
			const etherBalanceNumber = new BigNumber(etherBalance);
			const ten = new BigNumber(10);
			const etherMultiplier = ten.pow(18);
			const etherBalanceInWei = etherBalanceNumber.times(etherMultiplier);
			Vue.set(this.assetBalances, 'eth', etherBalanceInWei.toString());
			// ERC20
			if (!balance.tokens) {
				return;
			}
			for (const tokenData of balance.tokens) {
				const assetId = tokenData.tokenInfo.symbol.toLowerCase();
				const address = tokenData.tokenInfo.address;
				const price = tokenData.tokenInfo.price;
				const tickerAddress = addresses[assetId];
				if (!tickerAddress || (address != tickerAddress.toLowerCase())) {
					continue;
				}
				const balance = tokenData.balance.toString();
				Vue.set(this.assetBalances, assetId, balance);
				Vue.set(this.prices, assetId, price.rate);
			}
		},
		async _loadCompound() {
			const url = "https://api.thegraph.com/subgraphs/name/destiner/compound";
			const query = `
				query {
					userBalances(where: {
						id: "${this.account.address}"
					}) {
						balances {
							token {
								symbol
								supplyIndex
								borrowIndex
								supplyRate
								borrowRate
							}
							balance
						}
					}
				}`;
			const opts = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query })
			};
			const response = await fetch(url, opts);
			const json = await response.json();
			const data = json.data;
			if (data.userBalances.length == 0) {
				return;
			}
			const balances = data.userBalances[0].balances;
			for (const balance of balances) {
				const assetId = balance.token.symbol.substr(1).toLowerCase();
				const supplyIndex = balance.token.supplyIndex;
				const tokenRawBalance = balance.balance;
				// Set balances
				const tokenRawBalanceNumber = new BigNumber(tokenRawBalance);
				const tokenBalanceNumber = tokenRawBalanceNumber.times(supplyIndex).div('1e18');
				const tokenBalance = tokenBalanceNumber.toString();
				Vue.set(this.depositBalances.compound, assetId, tokenBalance);
				// Set rates
				const supplyRawRate = balance.token.supplyRate;
				const borrowRawRate = balance.token.borrowRate;
				const supplyRawRateNumber = new BigNumber(supplyRawRate);
				const borrowRawRateNumber = new BigNumber(borrowRawRate);
				const supplyRateNumber = supplyRawRateNumber.times('2102400').div('1e18');
				const borrowRateNumber = borrowRawRateNumber.times('2102400').div('1e18');
				const supplyRate = supplyRateNumber.toString();
				const borrowRate = borrowRateNumber.toString();
				Vue.set(this.rates.supply.compound, assetId, supplyRate);
				Vue.set(this.rates.borrow.compound, assetId, borrowRate);
			}
		},
		async _loadDydx() {
			const url = "https://api.thegraph.com/subgraphs/name/destiner/dydx";
			const query = `
				query {
					users(where: {
						id: "${this.account.address}"
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
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query })
			};
			const response = await fetch(url, opts);
			const json = await response.json();
			const data = json.data;
			if (data.users.length == 0) {
				return;
			}
			const balances = data.users[0].balances;
			for (const balance of balances) {
				const symbol = balance.market.token.symbol;
				const id = symbol == 'WETH'
					? 'eth'
					: symbol.toLowerCase();
				const index = balance.market.supplyIndex;
				const tokenRawBalance = balance.balance;
				// Set balances
				const tokenRawBalanceNumber = new BigNumber(tokenRawBalance);
				const tokenBalanceNumber = tokenRawBalanceNumber.times(index).div('1e18');
				const tokenBalance = tokenBalanceNumber.toString();
				Vue.set(this.depositBalances.dydx, id, tokenBalance);
				// Set rates
				const supplyRawRate = balance.market.supplyRate;
				const supplyRawRateNumber = new BigNumber(supplyRawRate);
				const supplyRateNumber = supplyRawRateNumber.div('1e18');
				const supplyRate = supplyRateNumber.toString();
				Vue.set(this.rates.supply.dydx, id, supplyRate);
			}
		},
		async _loadFulcrum() {
			const url = "https://api.thegraph.com/subgraphs/name/destiner/fulcrum";
			const query = `
				query {
					userBalances(where: {
						id: "${this.account.address}"
					}) {
						balances {
							token {
								symbol
								index
								supplyRate
								borrowRate
							}
							balance
						}
					}
				}`;
			const opts = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query })
			};
			const response = await fetch(url, opts);
			const json = await response.json();
			const data = json.data;
			if (data.userBalances.length == 0) {
				return;
			}
			const balances = data.userBalances[0].balances;
			for (const balance of balances) {
				const assetId = balance.token.symbol.substr(1).toLowerCase();
				const index = balance.token.index;
				const tokenRawBalance = balance.balance;
				// Set balances
				const tokenRawBalanceNumber = new BigNumber(tokenRawBalance);
				const tokenBalanceNumber = tokenRawBalanceNumber.times(index).div('1e18');
				const tokenBalance = tokenBalanceNumber.toString();
				Vue.set(this.depositBalances.fulcrum, assetId, tokenBalance);
				// Set rates
				const supplyRawRate = balance.token.supplyRate;
				const borrowRawRate = balance.token.borrowRate;
				const supplyRawRateNumber = new BigNumber(supplyRawRate);
				const borrowRawRateNumber = new BigNumber(borrowRawRate);
				const supplyRateNumber = supplyRawRateNumber.div('1e18').div('1e2');
				const borrowRateNumber = borrowRawRateNumber.div('1e18').div('1e2');
				const supplyRate = supplyRateNumber.toString();
				const borrowRate = borrowRateNumber.toString();
				Vue.set(this.rates.supply.fulcrum, assetId, supplyRate);
				Vue.set(this.rates.borrow.fulcrum, assetId, borrowRate);
			}
		},
	},
	computed: {
		plusCircleIcon() {
			return plusCircleIcon;
		},
	},
}
</script>

<style scoped>
.category-header {
	display: flex;
	align-items: baseline;
}

.icon {
	width: 24px;
	margin-left: 1em;
	opacity: 0.7;
}

.icon:hover {
	opacity: 1;
}

#swap-button {
	margin-left: 8px;
}

#advanced-buttons {
	margin-top: 1em;
}
</style>
