<template>
	<img :src="icon">
</template>

<script>
import AssetLoader from '../../utils/assetLoader.js';

export default {
	props: {
		setId: {
			type: String,
			default: '',
		},
	},
	computed: {
		icon() {
			return AssetLoader.loadSetLogo(this.setId);
		},
	}
};
</script>
