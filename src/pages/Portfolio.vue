<template>
	<div id="view">
		<WalletList
			id="wallet-section"
			:wallets="wallets"
			:prices="prices"
			:components="components"
		/>
		<div id="asset-section">
			<div
				v-if="assets.length > 0"
				class="category"
			>
				<div class="category-header">
					<h2 class="category-title">
						Assets
					</h2>
					<div class="category-value">
						{{ formatMoney(assetBalance) }}
					</div>
				</div>
				<AssetList
					:assets="assets"
					:prices="prices"
				/>
			</div>
			<div
				v-if="deposits.length > 0"
				class="category"
			>
				<div class="category-header">
					<h2 class="category-title">
						Deposits
					</h2>
					<div class="category-value">
						{{ formatMoney(depositBalance) }}
					</div>
				</div>
				<DepositList
					:deposits="deposits"
					:prices="prices"
					:rates="rates"
				/>
			</div>
			<div
				v-if="investments.length > 0"
				class="category"
			>
				<div class="category-header">
					<h2 class="category-title">
						Investments
					</h2>
					<div class="category-value">
						{{ formatMoney(investmentBalance) }}
					</div>
				</div>
				<InvestmentList
					:investments="investments"
					:components="components"
					:prices="prices"
				/>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from 'vue';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import Balance from '../utils/balance.js';
import Converter from '../utils/converter.js';
import Formatter from '../utils/formatter.js';
import Loader from '../utils/loader.js';
import Storage from '../utils/storage.js';
import Wallets from '../utils/wallets.js';

import addresses from '../data/addresses.json';

import AssetList from '../components/group/AssetList.vue';
import DepositList from '../components/group/DepositList.vue';
import InvestmentList from '../components/group/InvestmentList.vue';
import WalletList from '../components/group/WalletList.vue';

export default {
	components: {
		AssetList,
		DepositList,
		InvestmentList,
		WalletList,
	},
	data() {
		return {
			wallets: [],
			components: {
				uniswap: {},
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
		assets() {
			return Wallets.getAssets(this.wallets);
		},
		deposits() {
			return Wallets.getDeposits(this.wallets);
		},
		investments() {
			return Wallets.getInvestments(this.wallets);
		},
		assetBalance() {
			const balance = Balance.getAssets(this.assets, this.prices);
			return balance.toString();
		},
		depositBalance() {
			const balance = Balance.getDeposits(this.deposits, this.prices);
			return balance.toString();
		},
		investmentBalance() {
			const balance = Balance.getInvestments(this.investments, this.components, this.prices);
			return balance.toString();
		},
	},
	async mounted() {
		const walletList = Storage.getWalletList();
		if (walletList.length == 0) {
			this.$router.push('/login');
			return;
		}
		this._initWallets(walletList);
		await this._loadBalances();
		this._loadPrices();
	},
	methods: {
		formatMoney(moneyString) {
			return Formatter.formatMoney(moneyString);
		},
		_initWallets(walletList) {
			this.wallets = [];
			for (const wallet of walletList) {
				const address = wallet.address;
				const emptyWallet = {
					address,
					assets: {},
					deposits: {
						compound: {},
						dydx: {},
						fulcrum: {},
						maker: {},
					},
					investments: {
						uniswap: {},
						tokensets: {},
						melon: {},
					},
				};
				this.wallets.push(emptyWallet);
			}
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
			const assetSet = {};
			for (const asset of this.assets) {
				const { assetId } = asset;
				assetSet[assetId] = true;
			}
			for (const deposit of this.deposits) {
				const { assetId } = deposit;
				assetSet[assetId] = true;
			}
			for (const investment of this.investments) {
				const { platformId, investmentId } = investment;
				const components = this.components[platformId][investmentId];
				for (const component of components) {
					const { assetId } = component;
					assetSet[assetId] = true;
				}
			}
			const assets = Object.keys(assetSet);
			const prices = await Loader.loadPrices(assets);
			for (let i = 0; i < assets.length; i++) {
				const assetId = assets[i];
				const price = prices[assetId];
				Vue.set(this.prices, assetId, price);
			}
		},
		async _loadAssets() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const walletBalances = await Loader.loadAssets(addresses);
			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const balances = walletBalances[address];
				const wallet = this.wallets[i];
				for (const assetId in balances) {
					const balance = balances[assetId];
					Vue.set(wallet.assets, assetId, balance);
				}
			}
		},
		async _loadCompound() {
			const wallet = this.wallets[0];
			const address = wallet.address.toLowerCase();
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
				Vue.set(wallet.deposits.compound, assetId, tokenBalance);
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
			const wallet = this.wallets[0];
			const address = wallet.address.toLowerCase();
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
				Vue.set(wallet.deposits.dydx, assetId, marketBalance);
			}
		},
		async _loadFulcrum() {
			const wallet = this.wallets[0];
			const address = wallet.address.toLowerCase();
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
				Vue.set(wallet.deposits.fulcrum, assetId, tokenBalance);
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
			const wallet = this.wallets[0];
			const address = wallet.address.toLowerCase();
			const data = await Loader.loadMaker(address);
			if (data.users.length == 0) {
				return;
			}
			const maker = data.maker;
			const user = data.users[0];

			const rawRate = maker.rate;
			const rawRateNumber = new BigNumber(rawRate);
			const rateNumber = rawRateNumber.div('1e27').minus(1).times(60 * 60 * 24 * 365);
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
			Vue.set(wallet.deposits.maker, 'dai', totalBalance);
			Vue.set(this.rates.supply.maker, 'dai', rate);
		},
		async _loadUniswap() {
			const wallet = this.wallets[0];
			const address = wallet.address.toLowerCase();
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
				const totalEtherBalanceNumber = new BigNumber(pool.exchange.ethBalance);
				const totalTokenBalanceNumber = new BigNumber(pool.exchange.tokenBalance);

				const etherPerUniTokenNumber = totalEtherBalanceNumber.div(totalUniTokenBalanceNumber);
				const tokenPerUniTokenNumber = totalTokenBalanceNumber.div(totalUniTokenBalanceNumber);

				const uniTokenBalance = uniTokenBalanceNumber.times('1e18').toString();
				const etherPerUniToken = etherPerUniTokenNumber.toString();
				const tokenPerUniToken = tokenPerUniTokenNumber.toString();

				const investmentId = `${assetId}_eth`;
				const components = [{
					assetId: 'eth',
					amount: etherPerUniToken,
				}, {
					assetId,
					amount: tokenPerUniToken,
				}];
				Vue.set(wallet.investments.uniswap, investmentId, uniTokenBalance);
				Vue.set(this.components.uniswap, investmentId, components);
			}
		},
		async _loadTokenSets() {
			const wallet = this.wallets[0];
			const address = wallet.address.toLowerCase();
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
				Vue.set(wallet.investments.tokensets, investmentId, balance);
				Vue.set(this.components.tokensets, investmentId, components);
			}
		},
		async _loadMelon() {
			const wallet = this.wallets[0];
			const address = wallet.address.toLowerCase();
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
				Vue.set(wallet.investments.melon, investmentId, balance);
				Vue.set(this.components.melon, investmentId, components);
			}
		},
	},
};
</script>

<style scoped>
#view {
	display: flex;
}

#wallet-section {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	flex: 1;
	padding: 1.5em 1em;
}

#asset-section {
	flex: 3;
	padding: 3.25em 3.5em 0 3.5em;
}

#total {
	display: flex;
	justify-content: center;
}

.category {
	margin-bottom: 2em;
	padding: 0 2em 1em 2em;
	border: 1px solid #e7e8ea;
	border-radius: 8px;
}

.category-header {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
}

.category-title {
	font-size: 1.5em;
	font-weight: bold;
}

.category-value {
	font-size: 1.25em;
	font-weight: bold;
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
