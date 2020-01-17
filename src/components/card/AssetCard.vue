<template>
	<div id="card">
		<Card
			:amount="amount"
			:ticker="ticker"
			:wallet-id="walletId"
			:title="title"
			:price="price"
		/>
		<AssetIcon
			id="logo"
			:asset-id="assetId"
		/>
	</div>
</template>

<script>
import AssetIcon from '../icon/AssetIcon.vue';
import Card from './Card.vue';

import Formatter from '../../utils/formatter.js';

import tokens from '../../data/tokens.json';

export default {
	components: {
		AssetIcon,
		Card,
	},
	props: {
		amount: {
			type: String,
			default: '0',
		},
		assetId: {
			type: String,
			default: '',
		},
		walletId: {
			type: Number,
			default: 0,
		},
		price: {
			type: Number,
			default: 0,
		},
	},
	computed: {
		title() {
			const assetTitle = tokens[this.assetId];
			return assetTitle;
		},
		ticker() {
			return Formatter.formatAsset(this.assetId);
		},
	},
};
</script>

<style scoped>
#card {
	display: flex;
	justify-content: center;
	align-items: center;
}

#logo {
	width: 64px;
	height: 64px;
	position: absolute;
	pointer-events: none;
	opacity: 0.1;
}
</style>
