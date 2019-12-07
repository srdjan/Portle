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
		pools: {
			type: Object,
			default: () => {},
		},
		setBalances: {
			type: Object,
			default: () => {},
		},
		setComponents: {
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
				.plus(this._depositValue)
				.plus(this._poolValue);
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
		_poolValue() {
			let poolValue = new BigNumber(0);
			for (const platformId in this.pools) {
				for (const assetId in this.pools[platformId]) {
					const tokenPrice = this.prices[assetId];
					const etherPrice = this.prices.eth;
					if (!tokenPrice || !etherPrice) {
						continue;
					}
					const balance = this.pools[platformId][assetId];
					const tokenBalance = balance.token;
					const tokenAmount = Converter.toAmount(tokenBalance, assetId);
					const tokenAmountNumber = new BigNumber(tokenAmount);
					const etherBalance = balance.ether;
					const etherAmount = Converter.toAmount(etherBalance, 'eth');
					const etherAmountNumber = new BigNumber(etherAmount);
					const value = (tokenAmountNumber.times(tokenPrice))
						.plus(etherAmountNumber.times(etherPrice));
					poolValue = poolValue.plus(value);
				}
			}
			return poolValue;
		},
		_setValue() {
			let setValue = new BigNumber(0);
			for (const platformId in this.setBalances) {
				const platformBalances = this.setBalances[platformId];
				for (const setId in this.setBalances[platformId]) {
					const balance = platformBalances[setId];
					const components = this.setComponents[platformId][setId];
					let price = new BigNumber(0);
					for (const component of components) {
						const amountNumber = new BigNumber(component.amount);
						const assetId = component.assetId;
						const assetPrice = this.prices[assetId];
						if (!assetPrice) {
							break;
						}
						const componentPrice = amountNumber.times(assetPrice);
						price = price.plus(componentPrice);
					}
					if (price.isZero()) {
						continue;
					}
					const amount = Converter.toAmount(balance, 'eth');
					const amountNumber = new BigNumber(amount);
					const value = amountNumber.times(price).toString();
					setValue = setValue.plus(value);
				}
			}
			return setValue;
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
