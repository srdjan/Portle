<template>
	<img
		v-if="icon"
		:src="icon"
	>
</template>

<script>
import AssetLoader from '../../utils/assetLoader.js';

export default {
	props: {
		protocolId: {
			type: String,
			default: '',
		},
	},
	computed: {
		icon() {
			return AssetLoader.loadProtocolLogo(this.protocolId);
		},
	}
};
</script>
