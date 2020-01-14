<template>
	<div class="card">
		<img
			v-if="logo"
			class="logo"
			:src="logo"
		>
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
			<div>{{ formatMoney(price) }}/</div>
			<div>{{ formatMoney(value) }}</div>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import Formatter from '../utils/formatter.js';

export default {
	props: {
		logo: {
			type: String,
			default: '',
		},
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
	box-sizing: border-box;
	width: 11.25em;
	height: 5em;
	margin: 0.5em;
	padding: 0.5em 1em;
	box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.12);
	transition: transform .3s,box-shadow .3s,-webkit-transform .3s;
	transition-timing-function: cubic-bezier(.25,.1,.25,1);
	cursor: pointer;
}

.card:hover {
	box-shadow: 0 12px 36px rgba(0,0,0,.2);
}

.logo {
	width: 64px;
	height: 64px;
	position: absolute;
	margin-left: 3em;
	opacity: 0.1;
}

.amount {
	font-size: 1.125em;
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
	font-size: 0.875em;
	color: #79818c;
}

.sparse {
	display: flex;
	justify-content: space-between;
}
</style>
