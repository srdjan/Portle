<template>
	<div id="list">
		<div
			v-for="asset in assets"
			:key="asset.assetId"
			class="card"
			@click="openAsset(asset)"
		>
			<div class="amount">
				{{ formatAmount(asset.amount) }} {{ formatAsset(asset.assetId) }}
			</div>
			<div class="description">
				{{ asset.title }}
			</div>
			<div class="price-value sparse">
				<div>{{ formatMoney(asset.price) }}</div>
				<div>{{ formatMoney(asset.value) }}</div>
			</div>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';

import tickers from '../../data/tickers.json';
import tokens from '../../data/tokens.json';
import decimals from '../../data/decimals.json';

export default {
	props: {
		balances: {
			type: Object,
			default: () => {},
		},
		prices: {
			type: Object,
			default: () => {},
		},
	},
	computed: {
		assets() {
			const assets = [];
			for (const assetId in this.balances) {
				const title = tokens[assetId];
				const balance = this.balances[assetId];
				const price = this.prices[assetId];
				const amount = Converter.toAmount(balance, assetId);
				const amountNumber = new BigNumber(amount);
				const value = amountNumber.times(price).toString();
				const asset = {
					assetId,
					title,
					amount,
					price,
					value,
				};
				if (this._isShown(asset)) {
					assets.push(asset);
				}
			}
			assets.sort((a, b) => {
				const aValue = new BigNumber(a.value);
				const bValue = new BigNumber(b.value);
				return aValue.lt(bValue)
					? 1
					: aValue.gt(bValue)
						? -1
						: 0;
			});
			return assets;
		},
	},
	methods: {
		openAsset(asset) {
			const assetId = asset.assetId;
			const path = `/asset/${assetId}`;
			this.$router.push(path);
		},
		formatAsset(assetId) {
			return Formatter.formatAsset(assetId);
		},
		formatAmount(amountString) {
			return Formatter.formatAmount(amountString);
		},
		formatMoney(priceString) {
			return Formatter.formatMoney(priceString);
		},
		_isShown(asset) {
			const value = new BigNumber(asset.value);
			return value.gt(1);
		},
	},
};
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