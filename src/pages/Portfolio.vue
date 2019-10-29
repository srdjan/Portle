<template>
	<div id="view">
		<TotalBalance :balances="balances" :prices="prices"/>
		<div class="header">
			<h2>Assets</h2>
		</div>
		<AssetList :balances="balances" :prices="prices"/>
	</div>
</template>

<script>
import Vue from 'vue';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import addresses from '../data/addresses.json';
import coinIds from '../data/coin-ids.json';

import TotalBalance from '../components/TotalBalance.vue';
import AssetList from '../components/group/AssetList.vue';

export default {
	components: {
		TotalBalance,
		AssetList,
	},
	data() {
		return {
			account: null,
			balances: {},
			prices: {},
		}
	},
	mounted() {
		this.loadAccount();
		if (!this.account) {
			this.$router.push('/login');
			return;
		}
		this.loadBalances();
		this.loadPrices();
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
		async loadBalances() {
			const url = `https://api.ethplorer.io/getAddressInfo/${this.account.address}?apiKey=freekey`;
			const response = await fetch(url);
			const balance = await response.json();
			// ETH
			const etherBalance = balance.ETH.balance;
			const etherBalanceNumber = new BigNumber(etherBalance);
			const ten = new BigNumber(10);
			const etherMultiplier = ten.pow(18);
			const etherBalanceInWei = etherBalanceNumber.times(etherMultiplier);
			Vue.set(this.balances, 'eth', etherBalanceInWei.toString());
			// ERC20
			if (!balance.tokens) {
				return;
			}
			for (const tokenData of balance.tokens) {
				const id = tokenData.tokenInfo.symbol.toLowerCase();
				const address = tokenData.tokenInfo.address;
				const price = tokenData.tokenInfo.price;
				const tickerAddress = addresses[id];
				if (!tickerAddress || (address != tickerAddress.toLowerCase())) {
					continue;
				}
				const balance = tokenData.balance.toString();
				Vue.set(this.balances, id, balance);
				Vue.set(this.prices, id, price.rate);
			}
		},
		async loadPrices() {
			const assets = ['dai', 'usdc', 'eth'];
			const assetIds = assets.map((asset) => coinIds[asset]);
			const assetIdString = assetIds.join('%2C');
			const url = `https://api.coingecko.com/api/v3/simple/price?ids=${assetIdString}&vs_currencies=usd`;
 			const response = await fetch(url);
			const prices = await response.json();
			for (let i = 0; i < assets.length; i++) {
				const id = assets[i];
				const coinId = assetIds[i];
				const price = prices[coinId].usd;
				Vue.set(this.prices, id, price);
			}
		},
	},
}
</script>

<style scoped>
#swap-button {
	margin-left: 8px;
}

#advanced-buttons {
	margin-top: 1em;
}
</style>
