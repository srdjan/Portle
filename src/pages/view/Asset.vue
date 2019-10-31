<template>
	<div id="view" v-if="asset">
		<div id="type">Asset</div>
		<div id="name">{{ asset.name }}</div>
		<div id="amount">{{ formatAmount(asset.amount) }} {{ asset.ticker }}</div>
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
			assetId: '',
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
		this.assetId = this.$route.params.assetId;
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
			const coinId = coinIds[this.assetId];
			const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
 			const response = await fetch(url);
			const prices = await response.json();
			this.price = prices[coinId].usd;
		},
		async loadBalance() {
			const url = `https://api.ethplorer.io/getAddressInfo/${this.account.address}?apiKey=freekey`;
			const response = await fetch(url);
			const balance = await response.json();
			if (this.assetId == 'eth') {
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
				const assetId = tokenData.tokenInfo.symbol.toLowerCase();
				if (assetId == this.assetId) {
					const balance = tokenData.balance.toString();
					this.balance = balance;
					break;
				}
			}
		},
		getAmountString(assetId) {
			const decimal = decimals[assetId];
			const balanceNumber = new BigNumber(this.balance);
			const ten = new BigNumber(10);
			const decimalNumber = ten.pow(decimal);
			const amount = balanceNumber.div(decimalNumber);
			return amount.toString();
		},
		getValueString(assetId) {
			const price = this.price;
			const priceNumber = new BigNumber(price);
			const amount = this.getAmountString(assetId);
			const value = priceNumber.times(amount);
			return value.toString();
		},
		formatAmount(amountString) {
			const amount = new BigNumber(amountString);
			return `${amount.toFixed(2)}`;
		},
		formatMoney(priceString) {
			const price = new BigNumber(priceString);
			return `$${price.toFixed(2)}`;
		},
	},
	computed: {
		asset() {
			if (!this.assetId) {
				return;
			}
			const asset = {
				name: tokens[this.assetId],
				ticker: tickers[this.assetId],
				amount: this.getAmountString(this.assetId),
				price: this.price,
				value: this.getValueString(this.assetId),
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
