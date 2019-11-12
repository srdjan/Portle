<template>
	<span class="input-group">
		<span
			class="max-label"
			@click="setMax()"
		>
			MAX
		</span>
		<input
			:value="amount"
			class="amount"
			@input="onAmountChange"
		>
		<span class="label label-right inline">{{ formatAsset(id) }}</span>
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
