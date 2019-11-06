<template>
	<div
		v-if="asset"
		id="view"
	>
		<div id="type">
			Asset
		</div>
		<div id="name">
			{{ asset.name }}
		</div>
		<div id="amount">
			{{ formatAmount(asset.amount) }} {{ formatAsset(asset.assetId) }}
		</div>
		<div id="value">
			{{ formatMoney(asset.value) }} @ {{ formatMoney(asset.price) }}/{{ formatAsset(asset.assetId) }}
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import { account } from '../../mixins/account.js';

import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';

import tickers from '../../data/tickers.json';
import tokens from '../../data/tokens.json';
import decimals from '../../data/decimals.json';
import coinIds from '../../data/coin-ids.json';

export default {
	mixins: [
		account,
	],
	data() {
		return {
			assetId: '',
			balance: 0,
			price: 0,
		};
	},
	computed: {
		asset() {
			if (!this.assetId) {
				return;
			}
			const assetId = this.assetId;
			const balance = this.balance;
			const amount = Converter.toAmount(balance, assetId);
			const asset = {
				name: tokens[assetId],
				assetId,
				amount,
				price: this.price,
				value: this._getValueString(balance, assetId),
			};
			return asset;
		},
	},
	mounted() {
		if (!this.account.address) {
			this.$router.push('/login');
			return;
		}
		this.assetId = this.$route.params.assetId;
		this._loadPrice();
		this._loadBalance();
	},
	methods: {
		formatAsset(assetId) {
			return Formatter.formatAsset(assetId);
		},
		formatAmount(amountString) {
			return Formatter.formatAmount(amountString);
		},
		formatMoney(priceString) {
			return Formatter.formatMoney(priceString);
		},
		async _loadPrice() {
			const coinId = coinIds[this.assetId];
			const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
			const response = await fetch(url);
			const prices = await response.json();
			this.price = prices[coinId].usd;
		},
		async _loadBalance() {
			const url = `https://api.ethplorer.io/getAddressInfo/${this.account.address}?apiKey=freekey`;
			const response = await fetch(url);
			const balance = await response.json();
			if (this.assetId == 'eth') {
				// ETH
				const etherBalance = balance.ETH.balance;
				const etherBalanceNumber = new BigNumber(etherBalance);
				const ten = new BigNumber(10);
				const etherMultiplier = ten.pow(18);
				const etherBalanceInWei = etherBalanceNumber.times(etherMultiplier);
				this.balance = etherBalanceInWei.toString();
				return;
			}
			// ERC20
			if (!balance.tokens) {
				return;
			}
			for (const tokenData of balance.tokens) {
				const assetId = tokenData.tokenInfo.symbol.toLowerCase();
				if (assetId == this.assetId) {
					const balance = tokenData.balance.toString();
					this.balance = balance;
					break;
				}
			}
		},
		_getValueString(balanceString, assetId) {
			const price = this.price;
			const priceNumber = new BigNumber(price);
			const amount = Converter.toAmount(balanceString, assetId);
			const value = priceNumber.times(amount);
			return value.toString();
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

#name {
	margin-top: 2em;
}

#amount {
	font-size: 3em;
	font-weight: bold;
}

#value {
	font-size: 1.15em;
}
</style>
