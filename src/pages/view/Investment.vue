<template>
	<div
		v-if="investment"
		id="view"
	>
		<div id="type">
			Investment
		</div>
		<div id="platform">
			{{ formatPlatform(investment.platformId) }}
		</div>
		<div id="name">
			{{ formatInvestmentName(investment) }}
		</div>
		<div id="amount">
			{{ formatAmount(investment.amount) }} {{ formatInvestmentId(investment) }}
		</div>
		<div id="underlying">
			<span>Underlying assets:</span>
			<span
				v-for="component in components"
				:key="component.assetId"
				class="component"
			>
				{{ formatAmount(getUnderlyingAmount(component)) }} {{ formatAsset(component.assetId) }}
			</span>
		</div>
		<div id="value">
			{{ formatMoney(investment.value) }}  @ {{ formatMoney(investment.price) }}/{{ formatInvestmentId(investment) }}
		</div>
	</div>
</template>

<script>
import Vue from 'vue';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';
import Loader from '../../utils/loader.js';

import addresses from '../../data/addresses.json';

export default {
	data() {
		return {
			address: '',
			platformId: '',
			investmentId: '',
			balance: {},
			components: {},
			prices: {},
		};
	},
	computed: {
		investment() {
			if (Object.keys(this.balance).length == 0) {
				return;
			}
			const price = this._getPrice(this.components);
			if (!price) {
				return;
			}
			const investmentId = this.investmentId;
			const platformId = this.platformId;
			const amount = Converter.toAmount(this.balance, 'eth');
			const amountNumber = new BigNumber(amount);
			const value = amountNumber.times(price).toString();
			const investment = {
				investmentId,
				platformId,
				amount,
				price,
				value,
			};
			return investment;
		},
	},
	async mounted() {
		this.address = this.$route.params.address;
		this.platformId = this.$route.params.platformId;
		this.investmentId = this.$route.params.investmentId;
		await this._loadInvestment();
		this._loadPrices();
	},
	methods: {
		getUnderlyingAmount(component) {
			const componentAmount = component.amount;
			const componentAmountNumber = new BigNumber(componentAmount);
			const investmentAmount = this.investment.amount;
			return componentAmountNumber.times(investmentAmount);
		},
		formatAsset(assetId) {
			return Formatter.formatAsset(assetId);
		},
		formatInvestmentId(investment) {
			if (investment.platformId == 'tokensets') {
				return Formatter.formatSet(investment.investmentId);
			}
			if (investment.platformId == 'melon') {
				return 'sh.';
			}
			return investment.investmentId;
		},
		formatInvestmentName(investment) {
			if (investment.platformId == 'tokensets') {
				return Formatter.formatSetName(investment.investmentId);
			}
			return investment.investmentId;
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
		async _loadInvestment() {
			if (this.platformId == 'uniswap') {
				await this._loadUniswap();
			}
			if (this.platformId == 'tokensets') {
				await this._loadTokenSet();
			}
			if (this.platformId == 'melon') {
				await this._loadMelon();
			}
		},
		async _loadPrices() {
			const assets = [];
			for (const component of this.components) {
				const assetId = component.assetId;
				assets.push(assetId);
			}
			const prices = await Loader.loadPrices(assets);
			for (let i = 0; i < assets.length; i++) {
				const assetId = assets[i];
				const price = prices[assetId];
				Vue.set(this.prices, assetId, price);
			}
		},
		async _loadUniswap() {
			const addresses = [ this.address ];
			const data = await Loader.loadUniswap(addresses);
			const walletBalance = data[`user_${this.address}`];
			const pools = walletBalance.exchangeBalances;
			const addressMap = Converter.reverseMap(addresses);

			for (const pool of pools) {
				const assetAddress = ethers.utils.getAddress(pool.exchange.tokenAddress);
				const assetId = addressMap[assetAddress];
				const investmentId = `${assetId}_eth`;
				if (this.investmentId != investmentId) {
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

				const components = [{
					assetId: 'eth',
					amount: etherPerUniToken,
				}, {
					assetId,
					amount: tokenPerUniToken,
				}];
				this.balance = uniTokenBalance;
				this.components = components;
			}
		},
		async _loadTokenSet() {
			const addresses = [ this.address ];
			const data = await Loader.loadTokenSets(addresses);
			const walletBalance = data[`user_${this.address}`];
			const sets = walletBalance.balances;
			const addressMap = Converter.reverseMap(addresses);

			for (const set of sets) {
				const investmentId = set.set_.set_.symbol.toLowerCase();
				if (this.investmentId != investmentId) {
					continue;
				}
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
				this.balance = balance;
				this.components = components;
			}
		},
		async _loadMelon() {
			const addresses = [ this.address ];
			const data = await Loader.loadMelon(addresses);
			const walletBalance = data[`user_${this.address}`];
			const investments = walletBalance.investments;
			const addressMap = Converter.reverseMap(addresses);
			for (const investment of investments) {
				const investmentId = investment.fund.name;
				if (this.investmentId != investmentId) {
					continue;
				}
				const balance = investment.shares;
				const totalShares = investment.fund.totalSupply;
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
				this.balance = balance;
				this.components = components;
			}
		},
		_getPrice(components) {
			let price = new BigNumber(0);
			for (const component of components) {
				const amountNumber = new BigNumber(component.amount);
				const assetId = component.assetId;
				const assetPrice = this.prices[assetId];
				if (!assetPrice) {
					return;
				}
				const componentPrice = amountNumber.times(assetPrice);
				price = price.plus(componentPrice);
			}
			return price;
		},
	},
};
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
	border: 1px solid grey;
}

#platform {
	margin-top: 2em;
}

#name {
	margin-top: 1em;
}

#amount {
	font-size: 3em;
	font-weight: bold;
	text-align: center;
}

#value,
#underlying {
	font-size: 1.15em;
}

.component:not(:last-child)::after {
	content: "+";
}
</style>
