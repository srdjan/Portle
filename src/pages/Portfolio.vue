<template>
	<div id="view">
		<section id="wallet-section">
			<div id="total-value">
				Net worth: {{ totalBalance }}
			</div>

			<div id="wallet-list">
				<div id="wallet-list-header">
					Wallets
				</div>
				<div class="wallet">
					<div
						id="wallet-icon-1"
						class="wallet-icon"
					/>
					<div class="wallet-details">
						<div class="wallet-address">
							0x0443c74A…d9d64616
						</div>
						<div class="wallet-value">
							$7,631.12
						</div>
					</div>
				</div>
				<div id="add-wallet">
					<div id="add-wallet-icon">
						<img :src="plusIcon">
					</div>
					<div id="add-wallet-text">
						<div id="add-wallet-title">
							Add new wallet
						</div>
						<div id="add-wallet-subtitle">
							Metamask, ENS, address, etc
						</div>
					</div>
				</div>
			</div>
		</section>
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
						{{ assetBalance }}
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
						{{ depositBalance }}
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
						{{ investmentBalance }}
					</div>
				</div>
				<InvestmentList
					:investments="investments"
					:components="investmentComponents"
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

import addresses from '../data/addresses.json';

import plusIcon from '../../public/img/plus.svg';

import AssetList from '../components/group/AssetList.vue';
import DepositList from '../components/group/DepositList.vue';
import InvestmentList from '../components/group/InvestmentList.vue';

export default {
	components: {
		AssetList,
		DepositList,
		InvestmentList,
	},
	data() {
		return {
			wallets: [],
			investmentComponents: {
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
			const assets = [];
			if (this.wallets.length == 0) {
				return assets;
			}
			for (const walletId in this.wallets) {
				const wallet = this.wallets[walletId];
				for (const assetId in wallet.assets) {
					const balance = wallet.assets[assetId];
					if (balance != '0') {
						const asset = {
							walletId,
							assetId,
							balance,
						};
						assets.push(asset);
					}
				}
			}
			return assets;
		},
		deposits() {
			const deposits = [];
			if (this.wallets.length == 0) {
				return deposits;
			}
			for (const walletId in this.wallets) {
				const wallet = this.wallets[walletId];
				for (const platformId in wallet.deposits) {
					const platformBalance = wallet.deposits[platformId];
					for (const assetId in platformBalance) {
						const balance = platformBalance[assetId];
						if (balance != '0') {
							const deposit = {
								walletId,
								platformId,
								assetId,
								balance,
							};
							deposits.push(deposit);
						}
					}
				}
			}
			return deposits;
		},
		investments() {
			const investments = [];
			if (this.wallets.length == 0) {
				return investments;
			}
			for (const walletId in this.wallets) {
				const wallet = this.wallets[walletId];
				for (const platformId in wallet.investments) {
					const platformBalance = wallet.investments[platformId];
					for (const investmentId in platformBalance) {
						const balance = platformBalance[investmentId];
						if (balance != '0') {
							const deposit = {
								walletId,
								platformId,
								investmentId,
								balance,
							};
							investments.push(deposit);
						}
					}
				}
			}
			return investments;
		},
		totalBalance() {
			if (this.wallets.length == 0) {
				return Formatter.formatMoney('0');
			}
			const wallet = this.wallets[0];
			const assetBalances = wallet.assets;
			const depositBalances = wallet.deposits;
			const investmentBalances = wallet.investments;
			const balance = Balance.getTotal(
				assetBalances,
				depositBalances,
				investmentBalances,
				this.investmentComponents,
				this.prices
			);
			const balanceString = balance.toString();
			return Formatter.formatMoney(balanceString);
		},
		assetBalance() {
			const wallet = this.wallets[0];
			const assetBalances = wallet.assets;
			const balance = Balance.getAssets(assetBalances, this.prices);
			const balanceString = balance.toString();
			return Formatter.formatMoney(balanceString);
		},
		depositBalance() {
			const wallet = this.wallets[0];
			const depositBalances = wallet.deposits;
			const balance = Balance.getDeposits(depositBalances, this.prices);
			const balanceString = balance.toString();
			return Formatter.formatMoney(balanceString);
		},
		investmentBalance() {
			const wallet = this.wallets[0];
			const investmentBalances = wallet.investments;
			const balance = Balance.getInvestments(
				investmentBalances,
				this.investmentComponents,
				this.prices
			);
			const balanceString = balance.toString();
			return Formatter.formatMoney(balanceString);
		},
		plusIcon() {
			return plusIcon;
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
			const assetMap = {};
			const wallet = this.wallets[0];
			const assetBalances = wallet.assets;
			const depositBalances = wallet.deposits;
			for (const assetId in assetBalances) {
				assetMap[assetId] = true;
			}
			for (const platformId in depositBalances) {
				const platformBalance = depositBalances[platformId];
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
			const prices = await Loader.loadPrices(assets);
			for (let i = 0; i < assets.length; i++) {
				const assetId = assets[i];
				const price = prices[assetId];
				Vue.set(this.prices, assetId, price);
			}
		},
		async _loadAssets() {
			const wallet = this.wallets[0];
			const address = wallet.address;
			const balances = await Loader.loadBalance(address);
			for (const assetId in balances) {
				const balance = balances[assetId];
				Vue.set(wallet.assets, assetId, balance.balance);
				if (balance.price) {
					Vue.set(this.prices, assetId, balance.price);
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

				const investmentId = `eth_${assetId}`;
				const components = [{
					assetId: 'eth',
					amount: etherPerUniToken,
				}, {
					assetId,
					amount: tokenPerUniToken,
				}];
				Vue.set(wallet.investments.uniswap, investmentId, uniTokenBalance);
				Vue.set(this.investmentComponents.uniswap, investmentId, components);
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
				Vue.set(this.investmentComponents.tokensets, investmentId, components);
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
				Vue.set(this.investmentComponents.melon, investmentId, components);
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
	flex: 1;
	padding: 1.5em 1.125em;
}

#total-value {
	font-size: 1.125em;
	font-weight: bold;
}

#wallet-list {
	margin-top: 2.25em;
}

#wallet-list-header {
	margin-bottom: 1.125em;
	font-size: 1.125em;
	font-weight: bold;
}

.wallet,
#add-wallet {
	padding: 1.25em 0.5em;
	border-top: 1px solid #e7e8ea;
	display: flex;
	align-items: center;
}

.wallet-icon,
#add-wallet-icon {
	height: 2em;
	width: 2em;
	border-radius: 1em;
	background: #d6d6d6;
}

#wallet-icon-1 {
	background: teal;
}

.wallet-details,
#add-wallet-text {
	margin-left: 0.75em;
}

.wallet-address {
	font-size: 0.875em;
	color: #666;
}

.wallet-value {
	font-size: 1.125em;
	font-weight: bold;
}

#add-wallet-icon {
	display: flex;
	align-items: center;
	justify-content: center;
}

#add-wallet-icon > img {
	height: 1em;
	width: 1em;
}

#add-wallet-subtitle {
	font-size: 0.875em;
	color: #666;
}

#asset-section {
	flex: 3;
	padding: 3.25em 3.5em;
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
