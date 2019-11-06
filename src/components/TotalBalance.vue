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
			return balance.toString();
		},
		_assetValue() {
			let assetValue = new BigNumber(0);
			for (const assetId in this.assets) {
				const price = this.prices[assetId];
				if (!price) {
					continue;
				}
				const balance = this.assets[assetId];
				const amount = Converter.toAmount(balance, assetId);
				const amountNumber = new BigNumber(amount);
				const value = amountNumber.times(price);
				assetValue = assetValue.plus(value);
			}
			return assetValue;
		},
		_depositValue() {
			let depositValue = new BigNumber(0);
			for (const platformId in this.deposits) {
				for (const assetId in this.deposits[platformId]) {
					const price = this.prices[assetId];
					if (!price) {
						continue;
					}
					const balance = this.deposits[platformId][assetId];
					const amount = Converter.toAmount(balance, assetId);
					const amountNumber = new BigNumber(amount);
					const value = amountNumber.times(price);
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
	},
};
</script>

<style scoped>
#header {
	display: flex;
	justify-content: center;
}
</style>
