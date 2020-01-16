<template>
	<div>
		<div id="list">
			<Card
				v-for="investment in sortedInvestments"
				:key="investment.walletId + '-' + investment.platformId + '-' + investment.investmentId"
				:logo="getLogo(investment)"
				:amount="investment.amount"
				:ticker="formatInvestment(investment)"
				:wallet-id="investment.walletId"
				:title="formatPlatform(investment.platformId)"
				:price="investment.price"
				@click.native="openInvestment(investment)"
			/>
		</div>
		<div id="table">
			<Row
				v-for="investment in sortedInvestments"
				:key="investment.walletId + '-' + investment.platformId + '-' + investment.investmentId"
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

import AssetLoader from '../../utils/assetLoader.js';
import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';
import Storage from '../../utils/storage.js';

export default {
	components: {
		Card,
		Row,
	},
	props: {
		investments: {
			type: Array,
			default: () => [],
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
		sortedInvestments() {
			const investments = [];
			for (const rawInvestment of this.investments) {
				const { walletId, platformId, investmentId, balance } = rawInvestment;
				const components = this.components[platformId][investmentId];
				const price = this._getPrice(components);
				if (!price) {
					continue;
				}
				const amount = Converter.toAmount(balance, 'eth');
				const amountNumber = new BigNumber(amount);
				const value = amountNumber.times(price).toString();
				const investment = {
					walletId,
					investmentId,
					platformId,
					amount,
					price,
					value,
				};
				investments.push(investment);
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
			const { walletId, platformId, investmentId } = investment;
			const walletList = Storage.getWalletList();
			const walletAddress = walletList[walletId].address;
			const path = `/wallet/${walletAddress}/investment/${platformId}/${investmentId}`;
			this.$router.push(path);
		},
		formatInvestment(investment) {
			if (investment.platformId == 'uniswap') {
				return Formatter.formatUniswapPool(investment.investmentId);
			}
			if (investment.platformId == 'tokensets') {
				return Formatter.formatSet(investment.investmentId);
			}
			return investment.investmentId;
		},
		formatPlatform(platformId) {
			return Formatter.formatPlatform(platformId);
		},
		getLogo(investment) {
			if (investment.platformId == 'tokensets') {
				const setId = investment.investmentId;
				return AssetLoader.loadSetLogo(setId);
			}
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
