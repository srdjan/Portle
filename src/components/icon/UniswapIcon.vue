<template>
	<AssetIcon
		v-if="assetId"
		:asset-id="assetId"
	/>
</template>

<script>
import AssetIcon from './AssetIcon.vue';

export default {
	components: {
		AssetIcon,
	},
	props: {
		poolId: {
			type: String,
			default: '',
		},
	},
	computed: {
		assetId() {
			const items = this.poolId.split('_');
			return items[0];
		},
	}
};
</script>
