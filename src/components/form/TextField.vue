<template>
	<div
		class="wrapper"
		:class="{ invalid }"
	>
		<input
			id="field"
			type="text"
			class="field_input"
			:class="{ invalid }"
			:value="value"
			placeholder=""
			@input="onInput($event)"
		>
		<label
			for="field"
			class="label"
			:class="{ invalid }"
		>
			{{ label }}
		</label>
	</div>
</template>

<script>
export default {
	props: {
		label: {
			type: String,
			default: '',
		},
		value: {
			type: String,
			default: '',
		},
		invalid: {
			type: Boolean,
			default: false,
		},
	},
	methods: {
		onInput(e) {
			this.$emit('input', e.target.value);
		},
	},
};
</script>

<style scoped>
.label {
	display: block;
	position: absolute;
	width: 100%;
	top: 0;
	left: 0;
	margin: 0;
	padding: 18px 12px 0;
	color: var(--secondary-text-color);
	font-size: 0.875em;
	transition: all 0.2s;
	transform: translateY(-14px);
}

.wrapper {
	position: relative;
	border: 1px solid var(--outline-color);
	border-radius: 4px;
}

.field_input {
	display: block;
	color: var(--primary-text-color);
	appearance: none;
	width: 95%;
	padding: 0 12px 10px 12px;
	background: transparent;
	border: none;
	font-size: 1.125em;
	margin-top: 24px;
	outline: 0;
}

.field_input:placeholder-shown ~ .label {
	font-size: 1.125em;
	transform: translateY(0);
}

.field_input:focus ~ .label {
	color: var(--secondary-text-color);
	font-size: 0.875em;
	transform: translateY(-14px);
}

.wrapper.invalid {
	border-color: var(--error-color);
}

.label.invalid,
.field_input.invalid,
.field_input:focus ~ .label.invalid {
	color: var(--error-color);
}
</style>
