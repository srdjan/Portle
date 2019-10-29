<template>
	<div id="list">
		<div class="card" v-for="asset in assets" v-if="isShown(asset)">
			<div class="amount">{{ formatAmount(asset.amount) }} {{ asset.ticker }}</div>
			<div class="description">{{ asset.title }}</div>
			<div class="price-value sparse">
				<div>{{ formatMoney(asset.price) }}</div>
				<div>{{ formatMoney(asset.value)}}</div>
			</div>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import tickers from '../../data/tickers.json';
import tokens from '../../data/tokens.json';
import decimals from '../../data/decimals.json';

export default {
	props: [ 'balances', 'prices' ],
	methods: {
		isShown(asset) {
			return asset.value.gt(1);
		},
		getAmount(ticker) {
			const balance = this.balances[ticker];
			const decimals = this.decimals[ticker];
			const balanceNumber = new BigNumber(balance);
			const ten = new BigNumber(10);
			const decimalNumber = ten.pow(decimals);
			const amount = balanceNumber.div(decimalNumber);
			return amount;
		},
		getValue(ticker) {
			const price = this.prices[ticker];
			const priceNumber = new BigNumber(price);
			const balance = this.getAmount(ticker);
			const value = priceNumber.times(balance);
			return value;
		},
		formatAmount(amount) {
			return `${amount.toFixed(2)}`;
		},
		formatMoney(price) {
			return `$${price.toFixed(2)}`;
		},
	},
	computed: {
		tickers() {
			return tickers;
		},
		tokens() {
			return tokens;
		},
		decimals() {
			return decimals;
		},
		assets() {
			const assets = [];
			for (const id in this.balances) {
				const asset = {
					ticker: this.tickers[id],
					title: this.tokens[id],
					amount: new BigNumber(this.getAmount(id)),
					price: new BigNumber(this.prices[id]),
					value: new BigNumber(this.getValue(id)),
				};
				assets.push(asset);
			}
			assets.sort((a, b) => {
				return a.value.lt(b.value)
					? 1
					: a.value.gt(b.value)
						? -1
						: 0;
			})
			return assets;
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

.amount {
	font-size: 1.25em;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.description {
	margin-top: 0.25em;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.description,
.price-value {
	color: gray;
}

.sparse {
	display: flex;
	justify-content: space-between;
}
</style>