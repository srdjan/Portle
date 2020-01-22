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
			v-if="protocolId == 'tokensets'"
			id="logo"
			:set-id="investmentId"
		/>
		<UniswapIcon
			v-if="protocolId == 'uniswap'"
			id="logo"
			:pool-id="investmentId"
		/>
		<ProtocolIcon
			v-if="protocolId == 'melon'"
			id="logo"
			:protocol-id="protocolId"
		/>
	</div>
</template>

<script>
import Card from './Card.vue';
import SetIcon from '../icon/SetIcon.vue';
import UniswapIcon from '../icon/UniswapIcon.vue';
import ProtocolIcon from '../icon/ProtocolIcon.vue';

import Formatter from '../../utils/formatter.js';

export default {
	components: {
		Card,
		SetIcon,
		UniswapIcon,
		ProtocolIcon,
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
		protocolId: {
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
			if (this.protocolId == 'uniswap') {
				return Formatter.formatUniswapPool(this.investmentId);
			}
			if (this.protocolId == 'tokensets') {
				return Formatter.formatSet(this.investmentId);
			}
			return this.investmentId;
		},
		title() {
			const title = Formatter.formatProtocol(this.protocolId)
			return title;
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
