<template>
	<div id="list">
		<div class="card" v-for="deposit in deposits" v-if="isValuePositive(deposit)" @click="openDeposit(deposit)">
			<div class="balance">{{ formatAmount(deposit.amount) }} {{ deposit.ticker }}</div>
			<div class="platform sparse">
				<div>{{ formatPlatform(deposit.platformId) }}</div>
				<div>{{ formatRate(deposit.rate)}}</div>
			</div>
			<div class="details sparse">
				<div>{{ formatMoney(deposit.price) }}</div>
				<div>{{ formatMoney(deposit.value)}}</div>
			</div>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import tickers from '../../data/tickers.json';
import decimals from '../../data/decimals.json';

export default {
	props: [ 'balances', 'rates', 'prices', ],
	methods: {
		openDeposit(deposit) {
			const platformId = deposit.platformId.toLowerCase();
			const assetId = deposit.ticker.toLowerCase();
			const path = `/deposit/${platformId}/${assetId}`;
			this.$router.push(path);
		},
		getAmountString(platformId, assetId) {
			const balance = this.balances[platformId][assetId];
			const decimal = decimals[assetId];
			const balanceNumber = new BigNumber(balance);
			const ten = new BigNumber(10);
			const decimalNumber = ten.pow(decimal);
			const amount = balanceNumber.div(decimalNumber);
			return amount.toString();
		},
		getValueString(platformId, assetId) {
			const price = this.prices[assetId];
			const priceNumber = new BigNumber(price);
			const amount = this.getAmountString(platformId, assetId);
			const value = priceNumber.times(amount);
			return value.toString();
		},
		formatPlatform(platformId) {
			const platformMap = {
				'compound': 'Compound',
				'fulcrum': 'Fulcrum',
			};
			const platform = platformMap[platformId];
			return platform;
		},
		formatAmount(amountString) {
			const amount = new BigNumber(amountString);
			return `${amount.toFixed(2)}`;
		},
		formatRate(rateString) {
			const rate = new BigNumber(rateString);
			return `${(rate * 100).toFixed(2)}%`;
		},
		formatMoney(priceString) {
			const price = new BigNumber(priceString);
			return `$${price.toFixed(2)}`;
		},
		isValuePositive(deposit) {
			const value = new BigNumber(deposit.value);
			return value.gt(0);
		},
	},
	computed: {
		deposits() {
			const deposits = [];
			for (const platformId in this.balances) {
				const platformBalances = this.balances[platformId];
				for (const assetId in platformBalances) {
					const price = this.prices[assetId];
					const deposit = {
						amount: this.getAmountString(platformId, assetId),
						ticker: tickers[assetId],
						platformId,
						price,
						rate: this.rates.supply[platformId][assetId],
						value: this.getValueString(platformId, assetId),
					};
					deposits.push(deposit);
				}
			}
			deposits.sort((a, b) => {
				const aValue = new BigNumber(a.value);
				const bValue = new BigNumber(b.value);
				return aValue.lt(bValue)
					? 1
					: aValue.gt(bValue)
						? -1
						: 0;
			});
			return deposits;
		},
	},
}
</script>

<style scoped>
#list {
	display: flex;
	flex-wrap: wrap;
}

.card {
	width: 10em;
	height: 4.5em;
	margin: 0.5em;
	padding: 0.75em 1em;
	background: white;
	border-radius: 8px;
	box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 2px;
	cursor: pointer;
}

.card:hover {
	box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px;
}

.balance {
	font-size: 1.25em;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.platform {
	margin-top: 0.25em;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.platform,
.details {
	color: gray;
}

.sparse {
	display: flex;
	justify-content: space-between;
}
</style>
