<template>
	<div id="list">
		<div
			v-for="deposit in deposits"
			:key="deposit.platformId + '-' + deposit.assetId"
			class="card"
			@click="openDeposit(deposit)"
		>
			<div class="balance">
				{{ formatAmount(deposit.amount) }} {{ formatAsset(deposit.assetId) }}
			</div>
			<div class="platform sparse">
				<div>{{ formatPlatform(deposit.platformId) }}</div>
				<div>{{ formatRate(deposit.rate) }}</div>
			</div>
			<div class="details sparse">
				<div>{{ formatMoney(deposit.price) }}</div>
				<div>{{ formatMoney(deposit.value) }}</div>
			</div>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';

import tickers from '../../data/tickers.json';
import decimals from '../../data/decimals.json';

export default {
	props: {
		balances: {
			type: Object,
			default: () => {},
		},
		rates: {
			type: Object,
			default: () => {},
		},
		prices: {
			type: Object,
			default: () => {},
		},
	},
	computed: {
		deposits() {
			const deposits = [];
			for (const platformId in this.balances) {
				const platformBalances = this.balances[platformId];
				for (const assetId in platformBalances) {
					const price = this.prices[assetId];
					const rate = this.rates.supply[platformId][assetId];
					const balance = platformBalances[assetId];
					const amount = Converter.toAmount(balance, assetId);
					const amountNumber = new BigNumber(amount);
					const value = amountNumber.times(price).toString();
					const deposit = {
						amount,
						assetId,
						platformId,
						price,
						rate,
						value,
					};
					if (this._isShown(deposit)) {
						deposits.push(deposit);
					}
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
	methods: {
		openDeposit(deposit) {
			const platformId = deposit.platformId;
			const assetId = deposit.assetId;
			const path = `/deposit/${platformId}/${assetId}`;
			this.$router.push(path);
		},
		formatAsset(assetId) {
			return Formatter.formatAsset(assetId);
		},
		formatPlatform(platformId) {
			return Formatter.formatPlatform(platformId);
		},
		formatAmount(amountString) {
			return Formatter.formatAmount(amountString);
		},
		formatRate(rateString) {
			return Formatter.formatRate(rateString);
		},
		formatMoney(priceString) {
			return Formatter.formatMoney(priceString);
		},
		_isShown(deposit) {
			const value = new BigNumber(deposit.value);
			return value.gt(0);
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
