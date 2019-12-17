<template>
	<div>
		<div id="list">
			<Card
				v-for="pool in pools"
				:key="pool.platformId + '-' + pool.assetId"
				:amount="pool.amount"
				:ticker="formatTitle(pool.assetId)"
				:title="formatPlatform(pool.platformId)"
				:price="pool.price"
				@click.native="openPool(pool)"
			/>
		</div>
		<div id="table">
			<Row
				v-for="pool in pools"
				:key="pool.platformId + '-' + pool.assetId"
				:amount="pool.amount"
				:ticker="formatTitle(pool.assetId)"
				:title="formatPlatform(pool.platformId)"
				:price="pool.price"
				@click.native="openPool(pool)"
			/>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import Card from '../Card.vue';
import Row from '../Row.vue';

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
	components: {
		Card,
		Row,
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
					const price = valueNumber.div(amount).toNumber();
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
		formatTitle(assetId) {
			const asset = Formatter.formatAsset(assetId);
			const ether = Formatter.formatAsset('eth');
			const title = `(${asset} + ${ether})`;
			return title;
		},
		formatPlatform(platformId) {
			return Formatter.formatPlatform(platformId);
		},
	},
};
</script>

<style scoped>
#list {
	display: flex;
	flex-wrap: wrap;
}

#table {
	display: none;
}

@media (max-width: 767px) {
	#list {
		display: none;
	}

	#table {
		display: initial;
	}
}
</style>
