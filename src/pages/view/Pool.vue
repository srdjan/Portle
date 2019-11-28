<template>
	<div
		v-if="pool"
		id="view"
	>
		<div id="type">
			Pool
		</div>
		<div id="platform">
			{{ formatPlatform(pool.platformId) }}
		</div>
		<div id="amount">
			{{ formatAmount(pool.poolAmount) }} {{ uniTokenAssetId }}
		</div>
		<div id="detailedAmount">
			{{ formatAmount(pool.tokenAmount) }} {{ formatAsset(pool.assetId) }} + {{ formatAmount(pool.etherAmount) }} {{ formatAsset('eth') }}
		</div>
		<div id="value">
			{{ formatMoney(pool.value) }}  @ {{ formatMoney(pool.price) }}/{{ uniTokenAssetId }}
		</div>
	</div>
</template>

<script>
import Vue from 'vue';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import { account } from '../../mixins/account.js';

import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';
import Loader from '../../utils/loader.js';

import addresses from '../../data/addresses.json';

export default {
	mixins: [
		account,
	],
	data() {
		return {
			platformId: '',
			assetId: '',
			balance: {},
			prices: {},
		};
	},
	computed: {
		pool() {
			if (Object.keys(this.balance).length == 0) {
				return;
			}
			const assetId = this.assetId;
			const platformId = this.platformId;
			const tokenPrice = this.prices[assetId];
			const etherPrice = this.prices.eth;
			const balance = this.balance;
			if (!tokenPrice) {
				return;
			}
			const tokenBalance = balance.token;
			const tokenAmount = Converter.toAmount(tokenBalance, assetId);
			const tokenAmountNumber = new BigNumber(tokenAmount);
			const etherBalance = balance.ether;
			const etherAmount = Converter.toAmount(etherBalance, 'eth');
			const etherAmountNumber = new BigNumber(etherAmount);
			const poolBalance = balance.pool;
			const poolAmount = Converter.toAmount(poolBalance, 'eth');
			const valueNumber = (tokenAmountNumber.times(tokenPrice))
				.plus(etherAmountNumber.times(etherPrice));
			const value = valueNumber.toString();
			const price = valueNumber.div(poolAmount);
			const asset = {
				platformId,
				assetId,
				tokenAmount,
				etherAmount,
				poolAmount,
				value,
				price,
			};
			return asset;
		},
		uniTokenAssetId() {
			return `UNI-${this.formatAsset(this.assetId)}`;
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
		this._loadPool();
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
			const assets = [this.assetId, 'eth'];
			const prices = await Loader.loadPrice(assets);
			for (let i = 0; i < assets.length; i++) {
				const assetId = assets[i];
				const price = prices[i];
				Vue.set(this.prices, assetId, price);
			}
		},
		_loadPool() {
			if (this.platformId == 'uniswap') {
				this._loadUniswapPool();
			}
		},
		async _loadUniswapPool() {
			const address = this.account.address.toLowerCase();
			const data = await Loader.loadUniswap(address);
			if (data.userExchangeDatas.length == 0) {
				return;
			}
			const pools = data.userExchangeDatas;

			for (const pool of pools) {
				const addressMap = Converter.reverseMap(addresses);
				const assetAddress = ethers.utils.getAddress(pool.exchange.tokenAddress);
				const assetId = addressMap[assetAddress];
				if (this.assetId != assetId) {
					continue;
				}

				const uniTokenBalanceNumber = new BigNumber(pool.uniTokenBalance);
				const totalUniTokenBalanceNumber = new BigNumber(pool.exchange.totalUniToken);
				const rawEtherBalanceNumber = new BigNumber(pool.exchange.ethBalance);
				const rawTokenBalanceNumber = new BigNumber(pool.exchange.tokenBalance);

				const etherBalanceNumber = rawEtherBalanceNumber.times(uniTokenBalanceNumber).div(totalUniTokenBalanceNumber);
				const tokenBalanceNumber = rawTokenBalanceNumber.times(uniTokenBalanceNumber).div(totalUniTokenBalanceNumber);
				const etherBalance = Converter.toBalance(etherBalanceNumber, 'eth');
				const tokenBalance = Converter.toBalance(tokenBalanceNumber, assetId);
				const uniTokenBalance = Converter.toBalance(uniTokenBalanceNumber, 'eth');

				const poolBalance = {
					'ether': etherBalance.toString(),
					'token': tokenBalance.toString(),
					'pool': uniTokenBalance.toString(),
				};
				this.balance = poolBalance;
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
	border: 1px solid grey;
}

#platform {
	margin-top: 2em;
}

#amount {
	font-size: 3em;
	font-weight: bold;
}

#value,
#detailedAmount {
	font-size: 1.15em;
}

#action-wrapper {
	margin-top: 3em;
}
</style>
