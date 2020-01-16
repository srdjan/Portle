<template>
	<div>
		<div id="list">
			<Card
				v-for="asset in sortedAssets"
				:key="asset.assetId"
				:logo="getLogo(asset.assetId)"
				:amount="asset.amount"
				:ticker="formatAsset(asset.assetId)"
				:wallet-id="asset.walletId"
				:title="asset.name"
				:price="asset.price"
				@click.native="openAsset(asset)"
			/>
		</div>
		<div id="table">
			<Row
				v-for="asset in sortedAssets"
				:key="asset.assetId"
				:amount="asset.amount"
				:ticker="formatAsset(asset.assetId)"
				:title="asset.name"
				:price="asset.price"
				@click.native="openAsset(asset)"
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

import tokens from '../../data/tokens.json';

export default {
	components: {
		Card,
		Row,
	},
	props: {
		assets: {
			type: Array,
			default: () => [],
		},
		prices: {
			type: Object,
			default: () => {},
		},
	},
	computed: {
		sortedAssets() {
			const assets = [];
			for (const rawAsset of this.assets) {
				const { walletId, assetId, balance } = rawAsset;
				const name = tokens[assetId];
				const price = this.prices[assetId] || '0';
				const amount = Converter.toAmount(balance, assetId);
				const amountNumber = new BigNumber(amount);
				const value = amountNumber.times(price).toString();
				const asset = {
					walletId,
					assetId,
					name,
					amount,
					price,
					value,
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
			});
			const meaningfulAssets = assets.filter(asset => {
				const value = new BigNumber(asset.value);
				return value.gt(1);
			});
			return meaningfulAssets;
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