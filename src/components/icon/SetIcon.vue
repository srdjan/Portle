<template>
	<img :src="icon">
</template>

<script>
import AssetLoader from '../../utils/assetLoader.js';

export default {
	props: {
		id: {
			type: String,
			default: '',
		},
	},
	computed: {
		icon() {
			return AssetLoader.loadSetLogo(this.id);
		},
	}
};
</script>
