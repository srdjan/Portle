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
		getShortBalance(balance, id) {
			if (!balance) {
				return new BigNumber(0);
			}
			const decimal = decimals[id];
			const balanceNumber = new BigNumber(balance);
			const ten = new BigNumber(10);
			const decimalNumber = ten.pow(decimal);
			const shortBalance = balanceNumber.div(decimalNumber);
			return shortBalance;
		},
		getValue(balance, id) {
			const price = this.prices[id] || '0';
			const priceNumber = new BigNumber(price);
			const shortBalance = this.getShortBalance(balance, id);
			const value = priceNumber.times(shortBalance);
			return value;
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
			for (const id in this.assets) {
				const balance = this.assets[id];
				const value = this.getValue(balance, id);
				assetValue = assetValue.plus(value);
			}
			return assetValue;
		},
		depositValue() {
			let depositValue = new BigNumber(0);
			for (const platform in this.deposits) {
				for (const id in this.deposits[platform]) {
					const balance = this.deposits[platform][id];
					const value = this.getValue(balance, id);
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
