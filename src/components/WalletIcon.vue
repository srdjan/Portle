<template>
	<div
		:class="{ 
			'id-0': id == 0,
		}"
	/>
</template>

<script>
export default {
	props: {
		id: {
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
</style>
