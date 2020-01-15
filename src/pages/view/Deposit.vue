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
	</div>
</template>

<script>
import Vue from 'vue';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';
import Loader from '../../utils/loader.js';

import addresses from '../../data/addresses.json';

export default {
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
			const balance = this.balance;
			if (!price) {
				return;
			}
			const amount = Converter.toAmount(balance, assetId);
			const amountNumber = new BigNumber(amount);
			const value = amountNumber.times(price).toString();
			const asset = {
				platformId,
				assetId,
				amount,
				rate,
				price,
				value,
			};
			return asset;
		},
	},
	mounted() {
		this.address = this.$route.params.address;
		this.platformId = this.$route.params.platformId;
		this.assetId = this.$route.params.assetId;
		this._loadPrices();
		this._loadDeposit();
	},
	methods: {
		formatAsset(assetId) {
			return Formatter.formatAsset(assetId);
		},
		formatPlatform(platformId) {
			return Formatter.formatPlatform(platformId);
		},
		formatAmount(amountString) {
			return Formatter.formatAmount(amountString);
		},
		formatMoney(priceString) {
			return Formatter.formatMoney(priceString);
		},
		formatRate(rateString) {
			return Formatter.formatRate(rateString);
		},
		async _loadPrices() {
			const assets = ['dai', 'sai', 'usdc', 'eth', 'wbtc', 'rep', 'bat', 'zrx', 'link', 'knc'];
			const prices = await Loader.loadPrice(assets);
			for (let i = 0; i < assets.length; i++) {
				const assetId = assets[i];
				const price = prices[assetId];
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
			if (this.platformId == 'maker') {
				this._loadMakerDeposit();
			}
		},
		async _loadCompoundDeposit() {
			const data = await Loader.loadCompound(this.address);
			if (data.users.length == 0) {
				return;
			}
			const balances = data.users[0].balances;
			for (const balance of balances) {
				const addressMap = Converter.reverseMap(addresses);
				const assetAddress = ethers.utils.getAddress(balance.token.underlying.address);
				const assetId = addressMap[assetAddress];
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
			const data = await Loader.loadDydx(this.address);
			if (data.users.length == 0) {
				return;
			}
			const markets = data.markets;
			const market = markets.find(market => { 
				const addressMap = Converter.reverseMap(addresses);
				const assetAddress = ethers.utils.getAddress(market.token.address);
				const assetId = addressMap[assetAddress];
				return assetId == this.assetId;
			});
			const rawRate = market.supplyRate;
			const rawRateNumber = new BigNumber(rawRate);
			const rate = rawRateNumber.div('1e18');
			this.rate = rate;

			const balances = data.users[0].balances;
			const marketBalances = balances.reduce((map, balance) => {
				const addressMap = Converter.reverseMap(addresses);
				const assetAddress = ethers.utils.getAddress(balance.market.token.address);
				const assetId = addressMap[assetAddress];

				const index = balance.market.supplyIndex;
				const accountRawBalance = balance.balance;
				const accountRawBalanceNumber = new BigNumber(accountRawBalance);
				const accountBalanceNumber = accountRawBalanceNumber.times(index).div('1e18');
				if (accountBalanceNumber.isNegative()) {
					return map;
				}

				const prevMarketBalance = map[assetId] || '0';
				const marketBalanceNumber = accountBalanceNumber.plus(prevMarketBalance);
				const marketBalance = marketBalanceNumber.toString();
				map[assetId] = marketBalance;
				return map;
			}, {});
			this.balance = marketBalances[this.assetId] || '0';
		},
		async _loadFulcrumDeposit() {
			const data = await Loader.loadFulcrum(this.address);
			if (data.users.length == 0) {
				return;
			}
			const balances = data.users[0].balances;
			for (const balance of balances) {
				const addressMap = Converter.reverseMap(addresses);
				const assetAddress = ethers.utils.getAddress(balance.token.underlying.address);
				const assetId = addressMap[assetAddress];
				if (this.assetId != assetId) {
					continue;
				}
				const index = balance.token.supplyIndex;
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
		async _loadMakerDeposit() {
			const data = await Loader.loadMaker(this.address);
			if (data.users.length == 0) {
				return;
			}
			const maker = data.maker;
			const user = data.users[0];

			const rawRate = maker.rate;
			const rawRateNumber = parseFloat(rawRate);
			const rateNumber = (rawRateNumber / 1e27) ** (60 * 60 * 24 * 365) - 1;
			const index = maker.index;
			const rawBalance = user.balance;
			const rawChaiBalance = user.chaiBalance;
			const rawProxyBalance = user.proxy.balance;
			const rawBalanceNumber = new BigNumber(rawBalance);
			const rawChaiBalanceNumber = new BigNumber(rawChaiBalance);
			const rawProxyBalanceNumber = new BigNumber(rawProxyBalance);
			const rawTotalBalanceNumber = rawBalanceNumber
				.plus(rawChaiBalanceNumber)
				.plus(rawProxyBalanceNumber);
			const totalBalanceNumber = rawTotalBalanceNumber.times(index).div('1e27');
			const totalBalance = totalBalanceNumber.toString();
			this.balance = totalBalance;
			this.rate = rateNumber.toString();
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
	border: 1px solid grey;
}

#platform {
	margin-top: 2em;
}

#amount {
	font-size: 3em;
	font-weight: bold;
	text-align: center;
}

#value,
#rate {
	font-size: 1.15em;
}

#action-wrapper {
	margin-top: 3em;
}
</style>
