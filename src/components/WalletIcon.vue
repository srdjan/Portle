<template>
	<div
		:class="{ 
			'id-0': id == 0,
			'id-1': id == 1,
			'id-2': id == 2,
			'id-3': id == 3,
			'id-4': id == 4,
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

.id-1 {
	background: chocolate;
}

.id-2 {
	background: darkcyan;
}

.id-3 {
	background: darkslateblue;
}

.id-4 {
	background: lightsalmon;
}
</style>
