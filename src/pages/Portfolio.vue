<template>
	<div id="view">
		<TotalBalance
			:assets="assetBalances"
			:deposits="depositBalances"
			:prices="prices"
		/>
		<div class="category-header">
			<h2>Assets</h2>
		</div>
		<AssetList
			:balances="assetBalances"
			:prices="prices"
		/>
		<div class="category-header">
			<h2>Deposits</h2>
			<img
				v-if="account && account.auth"
				:src="plusCircleIcon"
				class="icon"
				@click="openDepositManagePage()"
			>
		</div>
		<DepositList
			:balances="depositBalances"
			:prices="prices"
			:rates="rates"
		/>
	</div>
</template>

<script>
import Vue from 'vue';
import BigNumber from 'bignumber.js';

import { account } from '../mixins/account.js';

import Loader from '../utils/loader.js';

import plusCircleIcon from '../../public/img/plus-circle.svg';

import TotalBalance from '../components/TotalBalance.vue';
import AssetList from '../components/group/AssetList.vue';
import DepositList from '../components/group/DepositList.vue';

export default {
	components: {
		TotalBalance,
		AssetList,
		DepositList,
	},
	mixins: [
		account,
	],
	data() {
		return {
			assetBalances: {},
			depositBalances: {
				compound: {},
				dydx: {},
				fulcrum: {},
			},
			prices: {},
			rates: {
				supply: {
					compound: {},
					dydx: {},
					fulcrum: {},
				},
				borrow: {
					compound: {},
					dydx: {},
					fulcrum: {},
				},
			},
		};
	},
	computed: {
		plusCircleIcon() {
			return plusCircleIcon;
		},
	},
	mounted() {
		if (!this.account.address) {
			this.$router.push('/login');
			return;
		}
		this._loadPrices();
		this._loadBalances();
		this._loadCompound();
		this._loadDydx();
		this._loadFulcrum();
	},
	methods: {
		openDepositManagePage() {
			const path = '/deposit/manage';
			this.$router.push(path);
		},
		async _loadPrices() {
			const assets = ['dai', 'usdc', 'eth', 'rep', 'ampl'];
			const prices = await Loader.loadPrice(assets);
			for (let i = 0; i < assets.length; i++) {
				const assetId = assets[i];
				const price = prices[i];
				Vue.set(this.prices, assetId, price);
			}
			const etherPriceIndex = assets.indexOf('eth');
			const etherPrice = prices[etherPriceIndex];
			Vue.set(this.prices, 'weth', etherPrice);
		},
		async _loadBalances() {
			const address = this.account.address;
			const balances = await Loader.loadBalance(address);
			for (const assetId in balances) {
				const balance = balances[assetId];
				Vue.set(this.assetBalances, assetId, balance.balance);
				if (balance.price) {
					Vue.set(this.prices, assetId, balance.price);
				}
			}
		},
		async _loadCompound() {
			const address = this.account.address.toLowerCase();
			const data = await Loader.loadCompound(address);
			if (data.userBalances.length == 0) {
				return;
			}
			const balances = data.userBalances[0].balances;
			for (const balance of balances) {
				const assetId = balance.token.symbol.substr(1).toLowerCase();
				const supplyIndex = balance.token.supplyIndex;
				const tokenRawBalance = balance.balance;
				// Set balances
				const tokenRawBalanceNumber = new BigNumber(tokenRawBalance);
				const tokenBalanceNumber = tokenRawBalanceNumber.times(supplyIndex).div('1e18');
				const tokenBalance = tokenBalanceNumber.toString();
				Vue.set(this.depositBalances.compound, assetId, tokenBalance);
				// Set rates
				const supplyRawRate = balance.token.supplyRate;
				const borrowRawRate = balance.token.borrowRate;
				const supplyRawRateNumber = new BigNumber(supplyRawRate);
				const borrowRawRateNumber = new BigNumber(borrowRawRate);
				const supplyRateNumber = supplyRawRateNumber.times('2102400').div('1e18');
				const borrowRateNumber = borrowRawRateNumber.times('2102400').div('1e18');
				const supplyRate = supplyRateNumber.toString();
				const borrowRate = borrowRateNumber.toString();
				Vue.set(this.rates.supply.compound, assetId, supplyRate);
				Vue.set(this.rates.borrow.compound, assetId, borrowRate);
			}
		},
		async _loadDydx() {
			const address = this.account.address.toLowerCase();
			const data = await Loader.loadDydx(address);
			if (data.users.length == 0) {
				return;
			}
			const balances = data.users[0].balances;
			for (const balance of balances) {
				const symbol = balance.market.token.symbol;
				const id = symbol == 'WETH'
					? 'eth'
					: symbol.toLowerCase();
				const index = balance.market.supplyIndex;
				const tokenRawBalance = balance.balance;
				// Set balances
				const tokenRawBalanceNumber = new BigNumber(tokenRawBalance);
				const tokenBalanceNumber = tokenRawBalanceNumber.times(index).div('1e18');
				const tokenBalance = tokenBalanceNumber.toString();
				Vue.set(this.depositBalances.dydx, id, tokenBalance);
				// Set rates
				const supplyRawRate = balance.market.supplyRate;
				const supplyRawRateNumber = new BigNumber(supplyRawRate);
				const supplyRateNumber = supplyRawRateNumber.div('1e18');
				const supplyRate = supplyRateNumber.toString();
				Vue.set(this.rates.supply.dydx, id, supplyRate);
			}
		},
		async _loadFulcrum() {
			const address = this.account.address.toLowerCase();
			const data = await Loader.loadFulcrum(address);
			if (data.userBalances.length == 0) {
				return;
			}
			const balances = data.userBalances[0].balances;
			for (const balance of balances) {
				const assetId = balance.token.symbol.substr(1).toLowerCase();
				const index = balance.token.index;
				const tokenRawBalance = balance.balance;
				// Set balances
				const tokenRawBalanceNumber = new BigNumber(tokenRawBalance);
				const tokenBalanceNumber = tokenRawBalanceNumber.times(index).div('1e18');
				const tokenBalance = tokenBalanceNumber.toString();
				Vue.set(this.depositBalances.fulcrum, assetId, tokenBalance);
				// Set rates
				const supplyRawRate = balance.token.supplyRate;
				const borrowRawRate = balance.token.borrowRate;
				const supplyRawRateNumber = new BigNumber(supplyRawRate);
				const borrowRawRateNumber = new BigNumber(borrowRawRate);
				const supplyRateNumber = supplyRawRateNumber.div('1e18').div('1e2');
				const borrowRateNumber = borrowRawRateNumber.div('1e18').div('1e2');
				const supplyRate = supplyRateNumber.toString();
				const borrowRate = borrowRateNumber.toString();
				Vue.set(this.rates.supply.fulcrum, assetId, supplyRate);
				Vue.set(this.rates.borrow.fulcrum, assetId, borrowRate);
			}
		},
	},
};
</script>

<style scoped>
.category-header {
	display: flex;
}

.icon {
	width: 24px;
	margin: 1.25em 0 0 1em;
	opacity: 0.5;
}

.icon:hover {
	opacity: 1;
}

#swap-button {
	margin-left: 8px;
}

#advanced-buttons {
	margin-top: 1em;
}
</style>
