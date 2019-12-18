<template>
	<div class="card">
		<div class="amount">
			{{ formatAmount(amount) }} {{ ticker }}
		</div>
		<div class="title sparse">
			<div>{{ title }}</div>
			<div v-if="rate">
				{{ formatRate(rate) }}
			</div>
		</div>
		<div class="price-value sparse">
			<div>{{ formatMoney(price) }}</div>
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
.card {
	width: 10em;
	height: 4.5em;
	margin: 0.5em;
	padding: 0.75em 1em;
	background: white;
	border-radius: 8px;
	box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 2px;
	cursor: pointer;
}

.card:hover {
	box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px;
}

.amount {
	font-size: 1.25em;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.title {
	margin-top: 0.25em;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.title,
.price-value {
	color: grey;
}

.sparse {
	display: flex;
	justify-content: space-between;
}
</style>
