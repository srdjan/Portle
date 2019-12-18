<template>
	<div>
		<div id="list">
			<Card
				v-for="set in sets"
				:key="set.setId"
				:amount="set.amount"
				:ticker="formatSet(set.setId)"
				:title="formatPlatform(set.platformId)"
				:price="set.price"
				@click.native="openSet(set)"
			/>
		</div>
		<div id="table">
			<Row
				v-for="set in sets"
				:key="set.setId"
				:amount="set.amount"
				:ticker="formatSet(set.setId)"
				:title="formatPlatform(set.platformId)"
				:price="set.price"
				@click.native="openSet(set)"
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
	components: {
		Card,
		Row,
	},
	props: {
		balances: {
			type: Object,
			default: () => {},
		},
		components: {
			type: Object,
			default: () => {},
		},
		prices: {
			type: Object,
			default: () => {},
		},
	},
	computed: {
		sets() {
			const sets = [];
			for (const platformId in this.balances) {
				const platformBalances = this.balances[platformId];
				for (const setId in platformBalances) {
					const balance = platformBalances[setId];
					const components = this.components[platformId][setId];
					const price = this._getPrice(components);
					if (!price) {
						continue;
					}
					const amount = Converter.toAmount(balance, 'eth');
					const amountNumber = new BigNumber(amount);
					const value = amountNumber.times(price).toString();
					const set = {
						setId,
						platformId,
						amount,
						price,
						value,
					};
					sets.push(set);
				}
			}
			sets.sort((a, b) => {
				const aValue = new BigNumber(a.value);
				const bValue = new BigNumber(b.value);
				return aValue.lt(bValue)
					? 1
					: aValue.gt(bValue)
						? -1
						: 0;
			});
			const meaningfulSets = sets.filter(set => {
				const value = new BigNumber(set.value);
				return value.gt(1);
			});
			return meaningfulSets;
		},
	},
	methods: {
		openSet(set) {
			const setId = set.setId;
			const platformId = set.platformId;
			const path = `/set/${platformId}/${setId}`;
			this.$router.push(path);
		},
		formatSet(setId) {
			return Formatter.formatSet(setId);
		},
		formatPlatform(platformId) {
			return Formatter.formatPlatform(platformId);
		},
		_getPrice(components) {
			let price = new BigNumber(0);
			for (const component of components) {
				const amountNumber = new BigNumber(component.amount);
				const assetId = component.assetId;
				const assetPrice = this.prices[assetId];
				if (!assetPrice) {
					return;
				}
				const componentPrice = amountNumber.times(assetPrice);
				price = price.plus(componentPrice);
			}
			return price.toNumber();
		}
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
