<template>
	<div
		v-if="deposit"
		id="view"
	>
		<div id="type">
			Deposit
		</div>
		<div id="platform">
			{{ formatPlatform(deposit.platformId) }}
		</div>
		<div id="amount">
			{{ formatAmount(deposit.amount) }} {{ formatAsset(deposit.assetId) }}
		</div>
		<div id="rate">
			{{ formatRate(deposit.rate) }} annual rate
		</div>
		<div id="value">
			{{ formatMoney(deposit.value) }} @ {{ formatMoney(deposit.price) }}/{{ formatAsset(deposit.assetId) }}
		</div>
		<div
			v-if="account && account.auth"
			id="action-wrapper"
		>
			<button
				class="action"
				@click="openDeposit('deposit')"
			>
				Deposit
			</button>
			<button
				class="action"
				@click="openDeposit('withdraw')"
			>
				Withdraw
			</button>
		</div>
	</div>
</template>

<script>
import Vue from 'vue';
import BigNumber from 'bignumber.js';

import { loadAccount } from '../../mixins/loadAccount.js';

import tickers from '../../data/tickers.json';
import decimals from '../../data/decimals.json';
import coinIds from '../../data/coin-ids.json';

export default {
	mixins: [
		loadAccount,
	],
	data() {
		return {
			platformId: '',
			assetId: '',
			balance: 0,
			rate: 0,
			prices: {},
		};
	},
	computed: {
		deposit() {
			if (this.balance == 0) {
				return;
			}
			const assetId = this.assetId;
			const platformId = this.platformId;
			const rate = this.rate;
			const price = this.prices[assetId];
			if (!price) {
				return;
			}
			const asset = {
				platformId,
				assetId,
				amount: this._getAmountString(assetId),
				rate,
				price,
				value: this._getValueString(assetId),
			};
			return asset;
		},
	},
	mounted() {
		if (!this.account.address) {
			this.$router.push('/login');
			return;
		}
		this.platformId = this.$route.params.platformId;
		this.assetId = this.$route.params.assetId;
		this._loadPrices();
		this._loadDeposit();
	},
	methods: {
		openDeposit(action) {
			const path = '/deposit/manage';
			this.$router.state = {
				assetId: this.assetId,
				platformId: this.platformId,
				action,
			};
			this.$router.push(path);
		},
		formatAsset(assetId) {
			const ticker = tickers[assetId];
			return ticker;
		},
		formatPlatform(platformId) {
			const platformMap = {
				'compound': 'Compound',
				'dydx': 'dYdX',
				'fulcrum': 'Fulcrum',
			};
			const platform = platformMap[platformId];
			return platform;
		},
		formatAmount(amountString) {
			const amount = new BigNumber(amountString);
			return `${amount.toFixed(2)}`;
		},
		formatMoney(priceString) {
			const price = new BigNumber(priceString);
			return `$${price.toFixed(2)}`;
		},
		formatRate(rateString) {
			const rate = new BigNumber(rateString);
			return `${rate.times(100).toFixed(2)}%`;
		},
		async _loadPrices() {
			const assets = ['dai', 'usdc', 'eth', 'wbtc', 'rep', 'bat', 'zrx', 'link', 'knc'];
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
		_loadDeposit() {
			if (this.platformId == 'compound') {
				this._loadCompoundDeposit();
			}
			if (this.platformId == 'dydx') {
				this._loadDydxDeposit();
			}
			if (this.platformId == 'fulcrum') {
				this._loadFulcrumDeposit();
			}
		},
		_getAmountString(assetId) {
			const decimal = decimals[assetId];
			const balanceNumber = new BigNumber(this.balance);
			const ten = new BigNumber(10);
			const decimalNumber = ten.pow(decimal);
			const amount = balanceNumber.div(decimalNumber);
			return amount.toString();
		},
		_getValueString(assetId) {
			const price = this.prices[assetId];
			const priceNumber = new BigNumber(price);
			const amount = this._getAmountString(assetId);
			const value = priceNumber.times(amount);
			return value.toString();
		},
		async _loadCompoundDeposit() {
			const url = 'https://api.thegraph.com/subgraphs/name/destiner/compound';
			const query = `
				query {
					userBalances(where: {
						id: "${this.account.address}"
					}) {
						balances {
							token {
								symbol
								supplyIndex
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
			if (data.userBalances.length == 0) {
				return;
			}
			const balances = data.userBalances[0].balances;
			for (const balance of balances) {
				const assetId = balance.token.symbol.substr(1).toLowerCase();
				if (this.assetId != assetId) {
					continue;
				}
				const supplyIndex = balance.token.supplyIndex;
				const tokenRawBalance = balance.balance;
				// Set balance
				const tokenRawBalanceNumber = new BigNumber(tokenRawBalance);
				const tokenBalanceNumber = tokenRawBalanceNumber.times(supplyIndex).div('1e18');
				const tokenBalance = tokenBalanceNumber.toString();
				this.balance = tokenBalance;
				// Set rate
				const rawRate = balance.token.supplyRate;
				const rawRateNumber = new BigNumber(rawRate);
				const rateNumber = rawRateNumber.times('2102400').div('1e18');
				const rate = rateNumber.toString();
				this.rate = rate;
			}
		},
		async _loadDydxDeposit() {
			const url = 'https://api.thegraph.com/subgraphs/name/destiner/dydx';
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
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
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
				const assetId = symbol == 'WETH'
					? 'eth'
					: symbol.toLowerCase();
				if (this.assetId != assetId) {
					continue;
				}
				const index = balance.market.supplyIndex;
				const tokenRawBalance = balance.balance;
				// Set balances
				const tokenRawBalanceNumber = new BigNumber(tokenRawBalance);
				const tokenBalanceNumber = tokenRawBalanceNumber.times(index).div('1e18');
				const tokenBalance = tokenBalanceNumber.toString();
				this.balance = tokenBalance;
				// Set rates
				const supplyRawRate = balance.market.supplyRate;
				const supplyRawRateNumber = new BigNumber(supplyRawRate);
				const supplyRateNumber = supplyRawRateNumber.div('1e18');
				const supplyRate = supplyRateNumber.toString();
				this.rate = supplyRate;
			}
		},
		async _loadFulcrumDeposit() {
			const url = 'https://api.thegraph.com/subgraphs/name/destiner/fulcrum';
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
			if (data.userBalances.length == 0) {
				return;
			}
			const balances = data.userBalances[0].balances;
			for (const balance of balances) {
				const assetId = balance.token.symbol.substr(1).toLowerCase();
				if (this.assetId != assetId) {
					continue;
				}
				const index = balance.token.index;
				const tokenRawBalance = balance.balance;
				// Set balance
				const tokenRawBalanceNumber = new BigNumber(tokenRawBalance);
				const tokenBalanceNumber = tokenRawBalanceNumber.times(index).div('1e18');
				const tokenBalance = tokenBalanceNumber.toString();
				this.balance = tokenBalance;
				// Set rate
				const rawRate = balance.token.supplyRate;
				const rawRateNumber = new BigNumber(rawRate);
				const rateNumber = rawRateNumber.div('1e18').div('1e2');
				const rate = rateNumber.toString();
				this.rate = rate;
			}
		},
	},
};
</script>

<style scoped>
#view {
	display: flex;
	flex-direction: column;
	align-items: center;
}

#type {
	margin-top: 1em;
	padding: 0.25em 0.5em;
	color: grey;
	font-size: 0.8em;
	border: 1px solid gray;
}

#platform {
	margin-top: 2em;
}

#amount {
	font-size: 3em;
	font-weight: bold;
}

#value,
#rate {
	font-size: 1.15em;
}

#action-wrapper {
	margin-top: 3em;
}
</style>
