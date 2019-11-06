<template>
	<div>
		<h1
			id="header"
		>
			{{ formatMoney(totalBalance) }}
		</h1>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import Converter from '../utils/converter.js';
import Formatter from '../utils/formatter.js';

import decimals from '../data/decimals.json';

export default {
	props: {
		assets: {
			type: Object,
			default: () => {},
		},
		deposits: {
			type: Object,
			default: () => {},
		},
		prices: {
			type: Object,
			default: () => {},
		},
	},
	computed: {
		totalBalance() {
			const balance = this._assetValue
				.plus(this._depositValue);
			return balance;
		},
		_assetValue() {
			let assetValue = new BigNumber(0);
			for (const assetId in this.assets) {
				const balance = this.assets[assetId];
				const value = this._getValueString(balance, assetId);
				assetValue = assetValue.plus(value);
			}
			return assetValue;
		},
		_depositValue() {
			let depositValue = new BigNumber(0);
			for (const platformId in this.deposits) {
				for (const assetId in this.deposits[platformId]) {
					const balance = this.deposits[platformId][assetId];
					const value = this._getValueString(balance, assetId);
					depositValue = depositValue.plus(value);
				}
			}
			return depositValue;
		},
	},
	methods: {
		formatMoney(moneyString) {
			return Formatter.formatMoney(moneyString);
		},
		_getValueString(balanceString, assetId) {
			const price = this.prices[assetId] || '0';
			const priceNumber = new BigNumber(price);
			const amount = Converter.toAmount(balanceString, assetId);
			const value = priceNumber.times(amount);
			return value.toString();
		},
	},
};
</script>

<style scoped>
#header {
	display: flex;
	justify-content: center;
}
</style>
