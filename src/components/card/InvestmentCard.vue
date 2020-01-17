<template>
	<div id="card">
		<Card
			:amount="amount"
			:ticker="ticker"
			:wallet-id="walletId"
			:title="title"
			:price="price"
		/>
		<SetIcon
			v-if="platformId == 'tokensets'"
			id="logo"
			:set-id="investmentId"
		/>
	</div>
</template>

<script>
import SetIcon from '../icon/SetIcon.vue';
import Card from './Card.vue';

import Formatter from '../../utils/formatter.js';

export default {
	components: {
		SetIcon,
		Card,
	},
	props: {
		amount: {
			type: String,
			default: '0',
		},
		investmentId: {
			type: String,
			default: '',
		},
		walletId: {
			type: Number,
			default: 0,
		},
		platformId: {
			type: String,
			default: '',
		},
		price: {
			type: Number,
			default: 0,
		},
	},
	computed: {
		ticker() {
			if (this.platformId == 'uniswap') {
				return Formatter.formatUniswapPool(this.investmentId);
			}
			if (this.platformId == 'tokensets') {
				return Formatter.formatSet(this.investmentId);
			}
			return this.investmentId;
		},
		title() {
			return Formatter.formatPlatform(this.platformId);
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
