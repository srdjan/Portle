<template>
	<div id="view">
		<TotalBalance
			:assets="assetBalances"
			:deposits="depositBalances"
			:pools="poolBalances"
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
		<div class="category-header">
			<h2>Pools</h2>
		</div>
		<PoolList
			:balances="poolBalances"
			:prices="prices"
		/>
	</div>
</template>

<script>
import Vue from 'vue';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import { account } from '../mixins/account.js';

import Converter from '../utils/converter.js';
import Loader from '../utils/loader.js';

import addresses from '../data/addresses.json';

import plusCircleIcon from '../../public/img/plus-circle.svg';

import TotalBalance from '../components/TotalBalance.vue';
import AssetList from '../components/group/AssetList.vue';
import DepositList from '../components/group/DepositList.vue';
import PoolList from '../components/group/PoolList.vue';

export default {
	components: {
		TotalBalance,
		AssetList,
		DepositList,
		PoolList,
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
				maker: {},
			},
			poolBalances: {
				uniswap: {},
			},
			prices: {},
			rates: {
				supply: {
					compound: {},
					dydx: {},
					fulcrum: {},
					maker: {},
				},
				borrow: {
					compound: {},
					dydx: {},
					fulcrum: {},
					maker: {},
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
		this._loadMaker();
		this._loadUniswap();
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
				const addressMap = Converter.reverseMap(addresses);
				const assetAddress = ethers.utils.getAddress(balance.token.underlying.address);
				const assetId = addressMap[assetAddress];
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

			const markets = data.markets;
			for (const market of markets) {
				const addressMap = Converter.reverseMap(addresses);
				const assetAddress = ethers.utils.getAddress(market.token.address);
				const assetId = addressMap[assetAddress];

				const supplyRawRate = market.supplyRate;
				const supplyRawRateNumber = new BigNumber(supplyRawRate);
				const supplyRateNumber = supplyRawRateNumber.div('1e18');
				const supplyRate = supplyRateNumber.toString();
				Vue.set(this.rates.supply.dydx, assetId, supplyRate);
			}

			const balances = data.users[0].balances;
			const marketBalances = balances.reduce((map, balance) => {
				const addressMap = Converter.reverseMap(addresses);
				const assetAddress = ethers.utils.getAddress(balance.market.token.address);
				const assetId = addressMap[assetAddress];

				const index = balance.market.supplyIndex;
				const accountRawBalance = balance.balance;
				const accountRawBalanceNumber = new BigNumber(accountRawBalance);
				const accountBalanceNumber = accountRawBalanceNumber.times(index).div('1e18');
				if (accountBalanceNumber.isNegative()) {
					return map;
				}

				const prevMarketBalance = map[assetId] || '0';
				const marketBalanceNumber = accountBalanceNumber.plus(prevMarketBalance);
				const marketBalance = marketBalanceNumber.toString();
				map[assetId] = marketBalance;
				return map;
			}, {});
			for (const assetId in marketBalances) {
				const marketBalance = marketBalances[assetId];
				Vue.set(this.depositBalances.dydx, assetId, marketBalance);
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
				const addressMap = Converter.reverseMap(addresses);
				const assetAddress = ethers.utils.getAddress(balance.token.underlying.address);
				const assetId = addressMap[assetAddress];
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
		async _loadMaker() {
			const address = this.account.address.toLowerCase();
			// const proxyAddress = await Loader.getMakerProxyAddress(address);
			const data = await Loader.loadMaker(address);
			if (data.users.length == 0) {
				return;
			}
			const pot = data.pots[0];
			const user = data.users[0];

			const rawRate = pot.rate;
			const rawRateNumber = parseFloat(rawRate);
			const rateNumber = (rawRateNumber / 1e27) ** (60 * 60 * 24 * 365) - 1;
			const index = pot.index;
			const rawBalance = user.proxy.balance;
			const rawBalanceNumber = new BigNumber(rawBalance);
			const balanceNumber = rawBalanceNumber.times(index).div('1e27');
			const balance = balanceNumber.toString();
			const rate = rateNumber.toString();
			Vue.set(this.depositBalances.maker, 'dai', balance);
			Vue.set(this.rates.supply.maker, 'dai', rate);
		},
		async _loadUniswap() {
			const address = this.account.address.toLowerCase();
			const data = await Loader.loadUniswap(address);
			if (data.userExchangeDatas.length == 0) {
				return;
			}
			const pools = data.userExchangeDatas;

			for (const pool of pools) {
				const addressMap = Converter.reverseMap(addresses);
				const assetAddress = ethers.utils.getAddress(pool.exchange.tokenAddress);
				const assetId = addressMap[assetAddress];

				const uniTokenBalanceNumber = new BigNumber(pool.uniTokenBalance);
				const totalUniTokenBalanceNumber = new BigNumber(pool.exchange.totalUniToken);
				const rawEtherBalanceNumber = new BigNumber(pool.exchange.ethBalance);
				const rawTokenBalanceNumber = new BigNumber(pool.exchange.tokenBalance);

				const etherBalanceNumber = rawEtherBalanceNumber.times(uniTokenBalanceNumber).div(totalUniTokenBalanceNumber);
				const tokenBalanceNumber = rawTokenBalanceNumber.times(uniTokenBalanceNumber).div(totalUniTokenBalanceNumber);
				const etherBalance = Converter.toBalance(etherBalanceNumber, 'eth');
				const tokenBalance = Converter.toBalance(tokenBalanceNumber, assetId);

				const poolBalance = {
					'ether': etherBalance.toString(),
					'token': tokenBalance.toString(),
				};
				Vue.set(this.poolBalances.uniswap, assetId, poolBalance);
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
