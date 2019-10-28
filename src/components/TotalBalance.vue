<template>
	<div>
		<h1 id="header">{{ formatMoney(totalBalance) }}</h1>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import tokens from '../data/tokens.json';
import decimals from '../data/decimals.json';

export default {
	props: [ 'balances', 'prices' ],
	methods: {
		getShortBalance(balance, ticker) {
			if (!balance) {
				return new BigNumber(0);
			}
			const decimals = this.decimals[ticker];
			const balanceNumber = new BigNumber(balance);
			const ten = new BigNumber(10);
			const decimalNumber = ten.pow(decimals);
			const shortBalance = balanceNumber.div(decimalNumber);
			return shortBalance;
		},
		getValue(balance, ticker) {
			const price = this.prices[ticker] || '0';
			const priceNumber = new BigNumber(price);
			const shortBalance = this.getShortBalance(balance, ticker);
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
			const balance = this.assetValue;
			return balance;
		},
		assetValue() {
			let assetValue = new BigNumber(0);
			for (const ticker in this.balances) {
				const balance = this.balances[ticker];
				const value = this.getValue(balance, ticker);
				assetValue = assetValue.plus(value);
			}
			return assetValue;
		},
		tokens() {
			return tokens;
		},
		decimals() {
			return decimals;
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
