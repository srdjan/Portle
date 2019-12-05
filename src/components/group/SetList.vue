<template>
	<div id="list">
		<div
			v-for="set in sets"
			:key="set.setId"
			class="card"
		>
			<div class="amount">
				{{ formatAmount(set.amount) }} {{ formatSet(set.setId) }}
			</div>
			<div class="platform">
				{{ formatPlatform(set.platformId) }}
			</div>
			<div class="price-value sparse">
				<div>{{ formatMoney(set.price) }}</div>
				<div>{{ formatMoney(set.value) }}</div>
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
		formatSet(setId) {
			return Formatter.formatSet(setId);
		},
		formatAmount(amountString) {
			return Formatter.formatAmount(amountString);
		},
		formatPlatform(platformId) {
			return Formatter.formatPlatform(platformId);
		},
		formatMoney(priceString) {
			return Formatter.formatMoney(priceString);
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
			return price;
		}
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

.platform {
	margin-top: 0.25em;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.platform,
.price-value {
	color: grey;
}

.sparse {
	display: flex;
	justify-content: space-between;
}
</style>
