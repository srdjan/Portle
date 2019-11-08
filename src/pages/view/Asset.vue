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
import Loader from '../../utils/loader.js';

import tokens from '../../data/tokens.json';

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
			const name = tokens[assetId];
			const balance = this.balance;
			const price = this.price;
			const amount = Converter.toAmount(balance, assetId);
			const amountNumber = new BigNumber(amount);
			const value = amountNumber.times(price).toString();
			const asset = {
				name,
				assetId,
				amount,
				price,
				value,
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
			const assets = [ this.assetId ];
			const prices = await Loader.loadPrice(assets);
			this.price = prices[0];
		},
		async _loadBalance() {
			const address = this.account.address;
			const balances = await Loader.loadBalance(address);
			const balance = balances[this.assetId];
			this.balance = balance.balance;
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
