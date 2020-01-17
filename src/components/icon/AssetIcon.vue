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
		assetId: {
			type: String,
			default: '',
		},
	},
	computed: {
		icon() {
			return AssetLoader.loadAssetLogo(this.assetId);
		},
	}
};
</script>
