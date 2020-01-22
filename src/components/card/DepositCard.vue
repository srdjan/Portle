<template>
	<div id="card">
		<Card
			:amount="amount"
			:ticker="ticker"
			:wallet-id="walletId"
			:title="title"
			:subtitle="rate"
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
		protocolId: {
			type: String,
			default: '',
		},
		rate: {
			type: String,
			default: '0',
		},
		price: {
			type: Number,
			default: 0,
		},
	},
	computed: {
		ticker() {
			return Formatter.formatAsset(this.assetId);	
		},
		title() {
			return Formatter.formatProtocol(this.protocolId);
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
