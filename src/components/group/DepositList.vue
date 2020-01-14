<template>
	<div>
		<div id="list">
			<Card
				v-for="deposit in deposits"
				:key="deposit.platformId + '-' + deposit.assetId"
				:logo="getLogo(deposit.assetId)"
				:amount="deposit.amount"
				:ticker="formatAsset(deposit.assetId)"
				:title="formatPlatform(deposit.platformId)"
				:rate="deposit.rate"
				:price="deposit.price"
				@click.native="openDeposit(deposit)"
			/>
		</div>
		<div id="table">
			<Row
				v-for="deposit in deposits"
				:key="deposit.platformId + '-' + deposit.assetId"
				:amount="deposit.amount"
				:ticker="formatAsset(deposit.assetId)"
				:title="formatPlatform(deposit.platformId)"
				:rate="deposit.rate"
				:price="deposit.price"
				@click.native="openDeposit(deposit)"
			/>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import Card from '../Card.vue';
import Row from '../Row.vue';

import AssetLoader from '../../utils/assetLoader.js';
import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';

export default {
	components: {
		Card,
		Row,
	},
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
					const price = this.prices[assetId] || '0';
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
			const meaningfulDeposits = deposits.filter(deposit => {
				const value = new BigNumber(deposit.value);
				return value.gt(0);
			});
			return meaningfulDeposits;
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
		getLogo(assetId) {
			return AssetLoader.loadAssetLogo(assetId);
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
