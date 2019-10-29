<template>
	<div id="view" v-if="asset">
		<div id="type">Asset</div>
		<div id="name">{{ asset.name }}</div>
		<div id="amount">{{ formatAmount(asset.balance) }} {{ asset.ticker }}</div>
		<div id="value">{{ formatMoney(asset.value) }} @ {{ formatMoney(asset.price) }}/{{ asset.ticker }}</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import tickers from '../../data/tickers.json';
import tokens from '../../data/tokens.json';
import decimals from '../../data/decimals.json';
import coinIds from '../../data/coin-ids.json';

export default {
	data() {
		return {
			account: undefined,
			id: '',
			balance: 0,
			price: 0,
		}
	},
	mounted() {
		this.loadAccount();
		if (!this.account) {
			this.$router.push('/login');
			return;
		}
		this.id = this.$route.params.id;
		this.loadPrice();
		this.loadBalance();
	},
	methods: {
		loadAccount() {
			const address = localStorage.getItem('address');
			const auth = localStorage.getItem('auth') == 'true';
			if (!address) {
				return;
			}
			this.account = {
				address,
				auth,
			};
		},
		async loadPrice() {
			const coinId = coinIds[this.id];
			const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
 			const response = await fetch(url);
			const prices = await response.json();
			this.price = prices[coinId].usd;
		},
		async loadBalance() {
			const url = `https://api.ethplorer.io/getAddressInfo/${this.account.address}?apiKey=freekey`;
			const response = await fetch(url);
			const balance = await response.json();
			if (this.id == 'eth') {
				// ETH
				const etherBalance = balance.ETH.balance;
				const etherBalanceNumber = new BigNumber(etherBalance);
				const ten = new BigNumber(10);
				const etherMultiplier = ten.pow(18);
				const etherBalanceInWei = etherBalanceNumber.times(etherMultiplier);
				this.balance = etherBalanceInWei.toString()
				return;
			}
			// ERC20
			if (!balance.tokens) {
				return;
			}
			for (const tokenData of balance.tokens) {
				const id = tokenData.tokenInfo.symbol.toLowerCase();
				if (id == this.id) {
					const balance = tokenData.balance.toString();
					this.balance = balance;
					break;
				}
			}
		},
		getBalance(id) {
			const decimal = decimals[id];
			const balanceNumber = new BigNumber(this.balance);
			const ten = new BigNumber(10);
			const decimalNumber = ten.pow(decimal);
			const shortBalance = balanceNumber.div(decimalNumber);
			return shortBalance;
		},
		getValue(id) {
			const price = this.price;
			const priceNumber = new BigNumber(price);
			const balance = this.getBalance(id);
			const value = priceNumber.times(balance);
			return value;
		},
		formatAmount(amount) {
			return `${amount.toFixed(2)}`;
		},
		formatMoney(price) {
			return `$${price.toFixed(2)}`;
		},
	},
	computed: {
		asset() {
			if (!this.id) {
				return;
			}
			const asset = {
				name: tokens[this.id],
				ticker: tickers[this.id],
				balance: this.getBalance(this.id),
				price: this.price,
				value: this.getValue(this.id),
			};
			return asset;
		},
	},
}
</script>

<style scoped>
#view {
	display: flex;
	flex-direction: column;
	align-items: center;
}

#type {
	margin-top: 1em;
	padding: 0.25em 0.5em;
	color: grey;
	font-size: 0.8em;
	border: 1px solid gray;
}

#name {
	margin-top: 2em;
}

#amount {
	font-size: 3em;
	font-weight: bold;
}

#value {
	font-size: 1.15em;
}
</style>
