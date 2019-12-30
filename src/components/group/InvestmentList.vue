<template>
	<div>
		<div id="list">
			<Card
				v-for="investment in investments"
				:key="investment.investmentId"
				:amount="investment.amount"
				:ticker="formatInvestment(investment)"
				:title="formatPlatform(investment.platformId)"
				:price="investment.price"
				@click.native="openInvestment(investment)"
			/>
		</div>
		<div id="table">
			<Row
				v-for="investment in investments"
				:key="investment.investmentId"
				:amount="investment.amount"
				:ticker="formatInvestment(investment)"
				:title="formatPlatform(investment.platformId)"
				:price="investment.price"
				@click.native="openInvestment(investment)"
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
		investments() {
			const investments = [];
			for (const platformId in this.balances) {
				const platformBalances = this.balances[platformId];
				for (const investmentId in platformBalances) {
					const balance = platformBalances[investmentId];
					const components = this.components[platformId][investmentId];
					const price = this._getPrice(components);
					if (!price) {
						continue;
					}
					const amount = Converter.toAmount(balance, 'eth');
					const amountNumber = new BigNumber(amount);
					const value = amountNumber.times(price).toString();
					const investment = {
						investmentId,
						platformId,
						amount,
						price,
						value,
					};
					investments.push(investment);
				}
			}
			investments.sort((a, b) => {
				const aValue = new BigNumber(a.value);
				const bValue = new BigNumber(b.value);
				return aValue.lt(bValue)
					? 1
					: aValue.gt(bValue)
						? -1
						: 0;
			});
			const meaningfulInvestments = investments.filter(investment => {
				const value = new BigNumber(investment.value);
				return value.gt(1);
			});
			return meaningfulInvestments;
		},
	},
	methods: {
		openInvestment(investment) {
			const investmentId = investment.investmentId;
			const platformId = investment.platformId;
			const path = `/investment/${platformId}/${investmentId}`;
			this.$router.push(path);
		},
		formatInvestment(investment) {
			if (investment.platformId == 'tokensets') {
				return Formatter.formatSet(investment.investmentId);
			}
			return investment.investmentId;
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