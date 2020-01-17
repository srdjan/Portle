<template>
	<div
		:class="{ 
			'id-0': walletId == 0,
			'id-1': walletId == 1,
			'id-2': walletId == 2,
			'id-3': walletId == 3,
			'id-4': walletId == 4,
		}"
	/>
</template>

<script>
export default {
	props: {
		walletId: {
			type: Number,
			default: 0,
		},
	},
};
</script>

<style scoped>
div {
	height: 2em;
	width: 2em;
	border-radius: 1em;
	background: #d6d6d6;
}

.id-0 {
	background: teal;
}

.id-1 {
	background: darkslateblue;
}

.id-2 {
	background: gold;
}

.id-3 {
	background: lightcoral;
}

.id-4 {
	background: saddlebrown;
}
</style>
