<template>
	<span class="input-group">
		<span
			class="max-label"
			:class="{ 'max-label-disabled': disabled, 'max-label-active': isMax }"
			@click="setMax()"
		>
			MAX
		</span>
		<span :class="{ 'hidden': !isMax || !estimate }">~</span>
		<input
			:value="amount"
			:disabled="disabled"
			class="amount"
			:class="{ 'invalid': invalid }"
			@input="onAmountChange"
		>
		<span
			class="label label-right inline"
			:class="{ 'label-disabled': disabled }"
		>
			{{ formatAsset(id) }}
		</span>
	</span>
</template>

<script>
import Formatter from '../utils/formatter.js';

export default {
	props: {
		id: {
			type: String,
			default: 'dai',
		},
		amount: {
			type: String,
			default: '0',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		invalid: {
			type: Boolean,
			default: false,
		},
		estimate: {
			type: Boolean,
			default: false
		},
		isMax: {
			type: Boolean,
			default: false,
		},
		setMax: {
			type: Function,
			default: () => {},
		},
		onChange: {
			type: Function,
			default: () => {},
		},
	},
	methods: {
		onAmountChange(event) {
			const amount = event.target.value;
			this.onChange(this.id, amount);
		},
		formatAsset(id) {
			return Formatter.formatAsset(id);
		},
	},
};
</script>
