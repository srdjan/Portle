<template>
	<div id="list">
		<div
			v-for="pool in pools"
			:key="pool.platformId + '-' + pool.assetId"
			class="card"
			@click="openPool(pool)"
		>
			<div class="balance">
				{{ formatAmount(pool.amount) }} ({{ formatAsset(pool.assetId) }} + {{ formatAsset('eth') }})
			</div>
			<div class="platform sparse">
				<div>{{ formatPlatform(pool.platformId) }}</div>
			</div>
			<div class="details sparse">
				<div>{{ formatMoney(pool.price) }}</div>
				<div>{{ formatMoney(pool.value) }}</div>
			</div>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';

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
		pools() {
			const pools = [];
			for (const platformId in this.balances) {
				const platformBalances = this.balances[platformId];
				for (const assetId in platformBalances) {
					const tokenPrice = this.prices[assetId];
					const etherPrice = this.prices.eth;
					const balance = platformBalances[assetId];
					const tokenBalance = balance.token;
					const tokenAmount = Converter.toAmount(tokenBalance, assetId);
					const tokenAmountNumber = new BigNumber(tokenAmount);
					const etherBalance = balance.ether;
					const etherAmount = Converter.toAmount(etherBalance, 'eth');
					const etherAmountNumber = new BigNumber(etherAmount);
					const poolBalance = balance.pool;
					const amount = Converter.toAmount(poolBalance, 'eth');
					const valueNumber = (tokenAmountNumber.times(tokenPrice))
						.plus(etherAmountNumber.times(etherPrice));
					const value = valueNumber.toString();
					const price = valueNumber.div(amount);
					const pool = {
						amount,
						etherPrice,
						assetId,
						platformId,
						price,
						value,
					};
					pools.push(pool);
				}
			}
			pools.sort((a, b) => {
				const aValue = new BigNumber(a.value);
				const bValue = new BigNumber(b.value);
				return aValue.lt(bValue)
					? 1
					: aValue.gt(bValue)
						? -1
						: 0;
			});
			const meaningfulPools = pools.filter(pool => {
				const value = new BigNumber(pool.value);
				return value.gt(0);
			});
			return meaningfulPools;
		},
	},
	methods: {
		openPool(pool) {
			const platformId = pool.platformId;
			const assetId = pool.assetId;
			const path = `/pool/${platformId}/${assetId}`;
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
		formatMoney(priceString) {
			return Formatter.formatMoney(priceString);
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
	color: grey;
}

.sparse {
	display: flex;
	justify-content: space-between;
}
</style>
