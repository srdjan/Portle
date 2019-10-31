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
		getShortBalance(balance, assetId) {
			if (!balance) {
				return new BigNumber(0);
			}
			const decimal = decimals[assetId];
			const balanceNumber = new BigNumber(balance);
			const ten = new BigNumber(10);
			const decimalNumber = ten.pow(decimal);
			const shortBalance = balanceNumber.div(decimalNumber);
			return shortBalance;
		},
		getValue(balance, assetId) {
			const price = this.prices[assetId] || '0';
			const priceNumber = new BigNumber(price);
			const shortBalance = this.getShortBalance(balance, assetId);
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
			for (const assetId in this.assets) {
				const balance = this.assets[assetId];
				const value = this.getValue(balance, assetId);
				assetValue = assetValue.plus(value);
			}
			return assetValue;
		},
		depositValue() {
			let depositValue = new BigNumber(0);
			for (const platformId in this.deposits) {
				for (const assetId in this.deposits[platformId]) {
					const balance = this.deposits[platformId][assetId];
					const value = this.getValue(balance, assetId);
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
