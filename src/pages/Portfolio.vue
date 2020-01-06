<template>
	<div id="view">
		<TotalBalance
			:assets="assetBalances"
			:deposits="depositBalances"
			:pools="poolBalances"
			:investment-balances="investmentBalances"
			:investment-components="investmentComponents"
			:prices="prices"
		/>
		<div
			v-if="hasAssets"
			class="category"
		>
			<div class="category-header">
				<h2>Assets</h2>
			</div>
			<AssetList
				:balances="assetBalances"
				:prices="prices"
			/>
		</div>
		<div
			v-if="hasDeposits"
			class="category"
		>
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
		<div
			v-if="hasPools"
			class="category"
		>
			<div class="category-header">
				<h2>Pools</h2>
			</div>
			<PoolList
				:balances="poolBalances"
				:prices="prices"
			/>
		</div>
		<div
			v-if="hasInvestments"
			class="category"
		>
			<div class="category-header">
				<h2>Investments</h2>
			</div>
			<InvestmentList
				:balances="investmentBalances"
				:components="investmentComponents"
				:prices="prices"
			/>
		</div>
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
import InvestmentList from '../components/group/InvestmentList.vue';

export default {
	components: {
		TotalBalance,
		AssetList,
		DepositList,
		PoolList,
		InvestmentList,
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
			investmentBalances: {
				tokensets: {},
				melon: {},
			},
			investmentComponents: {
				tokensets: {},
				melon: {},
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
		hasAssets() {
			for (const assetId in this.assetBalances) {
				const assetBalance = this.assetBalances[assetId];
				if (assetBalance != '0') {
					return true;
				}
			}
			return false;
		},
		hasDeposits() {
			for (const platformId in this.depositBalances) {
				const platformBalance = this.depositBalances[platformId];
				for (const assetId in platformBalance) {
					const depositBalance = platformBalance[assetId];
					if (depositBalance != '0') {
						return true;
					}
				}
			}
			return false;
		},
		hasPools() {
			for (const platformId in this.poolBalances) {
				const platformBalance = this.poolBalances[platformId];
				for (const assetId in platformBalance) {
					const poolBalance = platformBalance[assetId].pool;
					if (poolBalance != '0') {
						return true;
					}
				}
			}
			return false;
		},
		hasInvestments() {
			for (const platformId in this.investmentBalances) {
				const platformBalance = this.investmentBalances[platformId];
				for (const assetId in platformBalance) {
					const investmentBalance = platformBalance[assetId];
					if (investmentBalance != '0') {
						return true;
					}
				}
			}
			return false;
		},
		plusCircleIcon() {
			return plusCircleIcon;
		},
	},
	async mounted() {
		if (!this.account.address) {
			this.$router.push('/login');
			return;
		}
		await this._loadBalances();
		this._loadPrices();
	},
	methods: {
		openDepositManagePage() {
			const path = '/deposit/manage';
			this.$router.push(path);
		},
		async _loadBalances() {
			const balancePromises = [
				this._loadAssets(),
				this._loadCompound(),
				this._loadDydx(),
				this._loadFulcrum(),
				this._loadMaker(),
				this._loadUniswap(),
				this._loadTokenSets(),
				this._loadMelon(),
			];
			await Promise.all(balancePromises);
		},
		async _loadPrices() {
			const assetMap = {};
			for (const assetId in this.assetBalances) {
				assetMap[assetId] = true;
			}
			for (const platformId in this.depositBalances) {
				const platformBalance = this.depositBalances[platformId];
				for (const assetId in platformBalance) {
					assetMap[assetId] = true;
				}
			}
			for (const platformId in this.poolBalances) {
				const platformBalance = this.poolBalances[platformId];
				for (const assetId in platformBalance) {
					assetMap[assetId] = true;
				}
			}
			for (const platformId in this.investmentComponents) {
				const platformComponents = this.investmentComponents[platformId];
				for (const investmentId in platformComponents) {
					const investmentComponents = platformComponents[investmentId];
					for (const investmentComponent of investmentComponents) {
						const assetId = investmentComponent.assetId;
						assetMap[assetId] = true;
					}
				}
			}
			const assets = Object.keys(assetMap);
			const prices = await Loader.loadPrice(assets);
			for (let i = 0; i < assets.length; i++) {
				const assetId = assets[i];
				const price = prices[assetId];
				Vue.set(this.prices, assetId, price);
			}
		},
		async _loadAssets() {
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
			if (data.users.length == 0) {
				return;
			}
			const balances = data.users[0].balances;
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
			if (data.users.length == 0) {
				return;
			}
			const balances = data.users[0].balances;
			for (const balance of balances) {
				const addressMap = Converter.reverseMap(addresses);
				const assetAddress = ethers.utils.getAddress(balance.token.underlying.address);
				const assetId = addressMap[assetAddress];
				const index = balance.token.supplyIndex;
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
			const data = await Loader.loadMaker(address);
			if (data.users.length == 0) {
				return;
			}
			const maker = data.maker;
			const user = data.users[0];

			const rawRate = maker.rate;
			const rawRateNumber = parseFloat(rawRate);
			const rateNumber = (rawRateNumber / 1e27) ** (60 * 60 * 24 * 365) - 1;
			const index = maker.index;
			const rawBalance = user.balance;
			const rawChaiBalance = user.chaiBalance;
			const rawProxyBalance = user.proxy.balance;
			const rawBalanceNumber = new BigNumber(rawBalance);
			const rawChaiBalanceNumber = new BigNumber(rawChaiBalance);
			const rawProxyBalanceNumber = new BigNumber(rawProxyBalance);
			const rawTotalBalanceNumber = rawBalanceNumber
				.plus(rawChaiBalanceNumber)
				.plus(rawProxyBalanceNumber);
			const totalBalanceNumber = rawTotalBalanceNumber.times(index).div('1e27');
			const totalBalance = totalBalanceNumber.toString();
			const rate = rateNumber.toString();
			Vue.set(this.depositBalances.maker, 'dai', totalBalance);
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
				if (!assetId) {
					continue;
				}

				const uniTokenBalanceNumber = new BigNumber(pool.uniTokenBalance);
				const totalUniTokenBalanceNumber = new BigNumber(pool.exchange.totalUniToken);
				const rawEtherBalanceNumber = new BigNumber(pool.exchange.ethBalance);
				const rawTokenBalanceNumber = new BigNumber(pool.exchange.tokenBalance);

				const etherBalanceNumber = rawEtherBalanceNumber.times(uniTokenBalanceNumber).div(totalUniTokenBalanceNumber);
				const tokenBalanceNumber = rawTokenBalanceNumber.times(uniTokenBalanceNumber).div(totalUniTokenBalanceNumber);
				const etherBalance = Converter.toBalance(etherBalanceNumber, 'eth');
				const tokenBalance = Converter.toBalance(tokenBalanceNumber, assetId);
				const uniTokenBalance = Converter.toBalance(uniTokenBalanceNumber, 'eth');

				const poolBalance = {
					'ether': etherBalance.toString(),
					'token': tokenBalance.toString(),
					'pool': uniTokenBalance.toString(),
				};
				Vue.set(this.poolBalances.uniswap, assetId, poolBalance);
			}
		},
		async _loadTokenSets() {
			const address = this.account.address.toLowerCase();
			const data = await Loader.loadTokenSets(address);
			if (data.users.length == 0) {
				return;
			}
			const addressMap = Converter.reverseMap(addresses);
			const sets = data.users[0].balances;
			for (const set of sets) {
				const investmentId = set.set_.set_.symbol.toLowerCase();
				const balance = set.balance;
				const units = set.set_.set_.units;
				const unitsNumber = new BigNumber(units);
				const naturalUnit = set.set_.set_.naturalUnit;
				const underlyingComponents = set.set_.underlyingSet.components;
				const underlyingUnits = set.set_.underlyingSet.units;
				const underlyingNaturalUnit = set.set_.underlyingSet.naturalUnit;
				const componentCount = underlyingComponents.length;
				const components = [];
				for (let i = 0; i < componentCount; i++) {
					const componentAddress = ethers.utils.getAddress(underlyingComponents[i]);
					const componentAssetId = addressMap[componentAddress];
					const componentUnit = underlyingUnits[i];
					const componentBalance = unitsNumber.times(componentUnit).div(underlyingNaturalUnit).div(naturalUnit).times('1e18');
					const componentAmount = Converter.toAmount(componentBalance, componentAssetId);
					const component = {
						assetId: componentAssetId,
						amount: componentAmount,
					};
					components.push(component);
				}
				Vue.set(this.investmentBalances.tokensets, investmentId, balance);
				Vue.set(this.investmentComponents.tokensets, investmentId, components);
			}
		},
		async _loadMelon() {
			const address = this.account.address.toLowerCase();
			const data = await Loader.loadMelon(address);
			if (!data.investor) {
				return;
			}
			const addressMap = Converter.reverseMap(addresses);
			const investments = data.investor.investments;
			for (const investment of investments) {
				const investmentId = investment.fund.name;
				const balance = investment.shares;
				const totalShares = investment.fund.totalSupply;
				if (totalShares == 0) {
					continue;
				}
				const currentHoldings = investment.fund.holdingsHistory
					.filter((holding, index, array) => holding.timestamp === array[0].timestamp && !new BigNumber(holding.amount).isZero());
				const holdingCount = currentHoldings.length;
				const components = [];
				for (let i = 0; i < holdingCount; i++) {
					const holding = currentHoldings[i];
					const holdingAmount = holding.amount;
					const holdingAmountNumber = new BigNumber(holdingAmount);
					const holdingAsset = holding.asset.id;
					const componentAddress = ethers.utils.getAddress(holdingAsset);
					const componentAssetId = addressMap[componentAddress];
					const componentAmount = holdingAmountNumber.div(totalShares).toString();
					const component = {
						assetId: componentAssetId,
						amount: componentAmount,
					};
					components.push(component);
				}
				Vue.set(this.investmentBalances.melon, investmentId, balance);
				Vue.set(this.investmentComponents.melon, investmentId, components);
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
