<template>
	<div>
		<h1 id="header">{{ formatMoney(totalBalance) }}</h1>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import decimals from '../data/decimals.json';

export default {
	props: [ 'assets', 'deposits', 'prices' ],
	methods: {
		getAmountString(balanceString, assetId) {
			if (!balanceString) {
				return new BigNumber(0);
			}
			const decimal = decimals[assetId];
			const balanceNumber = new BigNumber(balanceString);
			const ten = new BigNumber(10);
			const decimalNumber = ten.pow(decimal);
			const amount = balanceNumber.div(decimalNumber);
			return amount.toString();
		},
		getValueString(balanceString, assetId) {
			const price = this.prices[assetId] || '0';
			const priceNumber = new BigNumber(price);
			const amount = this.getAmountString(balanceString, assetId);
			const value = priceNumber.times(amount);
			return value.toString();
		},
		formatMoney(moneyString) {
			const money = new BigNumber(moneyString);
			return `$${money.toFixed(2)}`;
		},
	},
	computed: {
		totalBalance() {
			const balance = this.assetValue
				.plus(this.depositValue);
			return balance;
		},
		assetValue() {
			let assetValue = new BigNumber(0);
			for (const assetId in this.assets) {
				const balance = this.assets[assetId];
				const value = this.getValueString(balance, assetId);
				assetValue = assetValue.plus(value);
			}
			return assetValue;
		},
		depositValue() {
			let depositValue = new BigNumber(0);
			for (const platformId in this.deposits) {
				for (const assetId in this.deposits[platformId]) {
					const balance = this.deposits[platformId][assetId];
					const value = this.getValueString(balance, assetId);
					depositValue = depositValue.plus(value);
				}
			}
			return depositValue;
		},
	},
}
</script>

<style scoped>
#header {
	display: flex;
	justify-content: center;
}
</style>
