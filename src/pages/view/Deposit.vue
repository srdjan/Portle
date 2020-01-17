<template>
	<div id="view">
		<WalletList
			id="wallet-section"
			:wallets="wallets"
			:selected-wallet="walletId"
			:prices="prices"
			:components="components"
		/>
		<div id="deposit-section">
			<div id="deposit-icon">
				<img :src="assetLogo">
			</div>
			<div
				v-if="deposit"
				id="deposit-view"
			>
				<div id="amount">
					{{ formatAmount(deposit.amount) }} {{ formatAsset(deposit.assetId) }}
				</div>
				<div id="platform-details">
					<div>
						{{ formatPlatform(deposit.platformId) }}
					</div>
					<div>
						{{ formatRate(deposit.rate) }}
					</div>
				</div>
				<div id="asset-details">
					<div>
						{{ deposit.assetName }}
					</div>
					<div>
						{{ formatMoney(deposit.price) }}/
					</div>
					<div>
						{{ formatMoney(deposit.value) }}
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from 'vue';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import AssetLoader from '../../utils/assetLoader.js';
import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';
import Loader from '../../utils/loader.js';
import Storage from '../../utils/storage.js';
import Wallets from '../../utils/wallets.js';

import tokens from '../../data/tokens.json';
import tokenAddresses from '../../data/addresses.json';

import WalletList from '../../components/group/WalletList.vue';

export default {
	components: {
		WalletList,
	},
	data() {
		return {
			address: '',
			platformId: '',
			assetId: '',
			balance: 0,
			rate: 0,
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
		deposit() {
			if (this.balance == 0) {
				return;
			}
			const assetName = tokens[this.assetId];
			const assetId = this.assetId;
			const platformId = this.platformId;
			const rate = this.rate;
			const price = this.prices[assetId];
			const balance = this.balance;
			if (!price) {
				return;
			}
			const amount = Converter.toAmount(balance, assetId);
			const amountNumber = new BigNumber(amount);
			const value = amountNumber.times(price).toString();
			const asset = {
				platformId,
				assetId,
				assetName,
				amount,
				rate,
				price,
				value,
			};
			return asset;
		},
		assetLogo() {
			return AssetLoader.loadAssetLogo(this.assetId);
		},
		assets() {
			return Wallets.getAssets(this.wallets);
		},
		deposits() {
			return Wallets.getDeposits(this.wallets);
		},
		investments() {
			return Wallets.getInvestments(this.wallets);
		},
		walletId() {
			return this.wallets.findIndex(wallet => wallet.address == this.address);
		},
	},
	async mounted() {
		const walletList = Storage.getWalletList();
		if (walletList.length == 0) {
			this.$router.push('/login');
			return;
		}
		this.address = this.$route.params.wallet;
		this.platformId = this.$route.params.platformId;
		this.assetId = this.$route.params.assetId;

		this._initWallets(walletList);
		await this._loadBalances();
		await this._loadPrices();

		this.balance = this.wallets[this.walletId].deposits[this.platformId][this.assetId];
		this.price = this.prices[this.assetId];
		this.rate = this.rates.supply[this.platformId][this.assetId];
	},
	methods: {
		formatAsset(assetId) {
			return Formatter.formatAsset(assetId);
		},
		formatPlatform(platformId) {
			return Formatter.formatPlatform(platformId);
		},
		formatAmount(amountString) {
			return Formatter.formatAmount(amountString);
		},
		formatMoney(priceString) {
			return Formatter.formatMoney(priceString);
		},
		formatRate(rateString) {
			return Formatter.formatRate(rateString);
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
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const data = await Loader.loadCompound(addresses);
			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const walletBalance = data[`user_${address}`];
				if (!walletBalance) {
					continue;
				}
				const balances = walletBalance.balances;
				const wallet = this.wallets[i];
				for (const balance of balances) {
					const addressMap = Converter.reverseMap(tokenAddresses);
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
			}
		},
		async _loadDydx() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const data = await Loader.loadDydx(addresses);

			const markets = data.markets;
			for (const market of markets) {
				const addressMap = Converter.reverseMap(tokenAddresses);
				const assetAddress = ethers.utils.getAddress(market.token.address);
				const assetId = addressMap[assetAddress];

				const supplyRawRate = market.supplyRate;
				const supplyRawRateNumber = new BigNumber(supplyRawRate);
				const supplyRateNumber = supplyRawRateNumber.div('1e18');
				const supplyRate = supplyRateNumber.toString();
				Vue.set(this.rates.supply.dydx, assetId, supplyRate);
			}

			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const walletBalance = data[`user_${address}`];
				if (!walletBalance) {
					continue;
				}
				const balances = walletBalance.balances;
				const wallet = this.wallets[i];

				const marketBalances = balances.reduce((map, balance) => {
					const addressMap = Converter.reverseMap(tokenAddresses);
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
			}
		},
		async _loadFulcrum() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const data = await Loader.loadFulcrum(addresses);
			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const walletBalance = data[`user_${address}`];
				if (!walletBalance) {
					continue;
				}
				const balances = walletBalance.balances;
				const wallet = this.wallets[i];
				for (const balance of balances) {
					const addressMap = Converter.reverseMap(tokenAddresses);
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
			}
		},
		async _loadMaker() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const data = await Loader.loadMaker(addresses);

			const maker = data.maker;
			const index = maker.index;
			const rawRate = maker.rate;
			const rawRateNumber = new BigNumber(rawRate);
			const rateNumber = rawRateNumber.div('1e27').minus(1).times(60 * 60 * 24 * 365);
			const rate = rateNumber.toString();
			Vue.set(this.rates.supply.maker, 'dai', rate);

			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const user = data[`user_${address}`];
				if (!user) {
					continue;
				}
				const wallet = this.wallets[i];
				const rawBalance = user.balance;
				const rawChaiBalance = user.chaiBalance;
				const rawProxyBalance = user.proxy
					? user.proxy.balance
					: 0;
				const rawBalanceNumber = new BigNumber(rawBalance);
				const rawChaiBalanceNumber = new BigNumber(rawChaiBalance);
				const rawProxyBalanceNumber = new BigNumber(rawProxyBalance);
				const rawTotalBalanceNumber = rawBalanceNumber
					.plus(rawChaiBalanceNumber)
					.plus(rawProxyBalanceNumber);
				const totalBalanceNumber = rawTotalBalanceNumber.times(index).div('1e27');
				const totalBalance = totalBalanceNumber.toString();
				Vue.set(wallet.deposits.maker, 'dai', totalBalance);
			}
		},
		async _loadUniswap() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const data = await Loader.loadUniswap(addresses);
			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const walletBalance = data[`user_${address}`];
				if (!walletBalance) {
					continue;
				}
				const pools = walletBalance.exchangeBalances;
				const wallet = this.wallets[i];
				for (const pool of pools) {
					const addressMap = Converter.reverseMap(tokenAddresses);
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
			}
		},
		async _loadTokenSets() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const data = await Loader.loadTokenSets(addresses);
			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const walletBalance = data[`user_${address}`];
				if (!walletBalance) {
					continue;
				}
				const sets = walletBalance.balances;
				const wallet = this.wallets[i];
				const addressMap = Converter.reverseMap(tokenAddresses);
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
			}
		},
		async _loadMelon() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const data = await Loader.loadMelon(addresses);
			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const walletBalance = data[`user_${address}`];
				if (!walletBalance) {
					continue;
				}
				const investments = walletBalance.investments;
				const wallet = this.wallets[i];
				const addressMap = Converter.reverseMap(tokenAddresses);
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

#deposit-section {
	flex: 3;
	padding: 4.75em 3.5em 0 3.5em;
	display: flex;
	justify-content: center;
}

#deposit-icon {
	display: flex;
	position: absolute;
	width: 4em;
	height: 4em;
	margin-top: -2em;
	align-items: center;
	justify-content: center;
	background: #ededed;
	border-radius: 2em;
}

#deposit-icon > img {
	width: 3em;
	height: 3em;
}

#deposit-view {
	padding: 2.75em 3em 0 3em;
	box-sizing: border-box;
	width: 40em;
	height: 14.75em;
	background: #140925;
	border-radius: 8px;
	color: white;
}

#amount {
	font-size: 4em;
	text-align: center;
}

#platform-details,
#asset-details {
	display: flex;
	font-size: 1.5em;
	justify-content: space-between;
}

#platform-details {
	margin-top: 1.25rem;
}

#asset-details {
	margin-top: 0.875rem;
}
</style>
