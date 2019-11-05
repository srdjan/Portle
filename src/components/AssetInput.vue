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
			@input="onAmountChange"
			class="amount"
		>
		<span class="label label-ghost label-right inline">{{ formatAsset(id) }}</span>
	</span>
</template>

<script>
import tickers from '../data/tickers.json';

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
		formatAsset(id) {
			const ticker = tickers[id];
			return ticker;
		},
		onAmountChange(event) {
			const amount = event.target.value;
			this.onChange(this.id, amount);
		},
	},
};
</script>
