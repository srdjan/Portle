<template>
	<div id="list">
		<div class="card" v-for="asset in assets" v-if="isShown(asset)" @click="openAsset(asset)">
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
		openAsset(asset) {
			const assetId = asset.ticker.toLowerCase();
			const path = `/asset/${assetId}`;
			this.$router.push(path);
		},
		isShown(asset) {
			const value = new BigNumber(asset.value);
			return value.gt(1);
		},
		getAmountString(assetId) {
			const balance = this.balances[assetId];
			const decimal = decimals[assetId];
			const balanceNumber = new BigNumber(balance);
			const ten = new BigNumber(10);
			const decimalNumber = ten.pow(decimal);
			const amount = balanceNumber.div(decimalNumber);
			return amount.toString();
		},
		getValueString(assetId) {
			const price = this.prices[assetId];
			const priceNumber = new BigNumber(price);
			const balance = this.getAmountString(assetId);
			const value = priceNumber.times(balance);
			return value.toString();
		},
		formatAmount(amountString) {
			const amount = new BigNumber(amountString);
			return `${amount.toFixed(2)}`;
		},
		formatMoney(priceString) {
			const price = new BigNumber(priceString);
			return `$${price.toFixed(2)}`;
		},
	},
	computed: {
		assets() {
			const assets = [];
			for (const assetId in this.balances) {
				const asset = {
					ticker: tickers[assetId],
					title: tokens[assetId],
					amount: this.getAmountString(assetId),
					price: this.prices[assetId],
					value: this.getValueString(assetId),
				};
				assets.push(asset);
			}
			assets.sort((a, b) => {
				const aValue = new BigNumber(a.value);
				const bValue = new BigNumber(b.value);
				return aValue.lt(bValue)
					? 1
					: aValue.gt(bValue)
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