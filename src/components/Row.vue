<template>
	<div class="row">
		<div class="title sparse">
			<div>{{ title }}</div>
			<div>{{ formatMoney(price) }}</div>
		</div>
		<div class="amount sparse">
			<div>{{ formatAmount(amount) }} {{ ticker }}</div>
			<div>{{ formatMoney(value) }}</div>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import Formatter from '../utils/formatter.js';

export default {
	props: {
		amount: {
			type: String,
			default: '0',
		},
		ticker: {
			type: String,
			default: '',
		},
		title: {
			type: String,
			default: '',
		},
		rate: {
			type: String,
			default: '',
		},
		price: {
			type: Number,
			default: 0,
		},
	},
	computed: {
		value() {
			const amountNumber = new BigNumber(this.amount);
			const valueNumber = amountNumber.times(this.price);
			return valueNumber;
		},
	},
	methods: {
		formatAmount(amountString) {
			return Formatter.formatAmount(amountString);
		},
		formatRate(rateString) {
			return Formatter.formatRate(rateString);
		},
		formatMoney(priceString) {
			return Formatter.formatMoney(priceString);
		},
	}
};
</script>

<style scoped>
.row {
	padding: 0.25em 1em;
	background: white;
	border-bottom: 1px solid var(--outline-color);
	cursor: pointer;
}

.row:last-child {
	border: none;
}

.amount {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.title {
	font-size: 0.75em;
	margin-top: 0.25em;
	color: var(--secondary-text-color);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.sparse {
	display: flex;
	justify-content: space-between;
}

@media all and (max-width: 767px) {
	.row {
		padding: 0;
		border: none;
	}
}
</style>
