<template>
	<div
		v-if="set"
		id="view"
	>
		<div id="type">
			Investment
		</div>
		<div id="name">
			{{ formatPlatform(set.platformId) }}: {{ formatSetName(set.setId) }}
		</div>
		<div id="amount">
			{{ formatAmount(set.amount) }} {{ formatSet(set.setId) }}
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
			{{ formatMoney(set.value) }}  @ {{ formatMoney(set.price) }}/{{ formatSet(set.setId) }}
		</div>
	</div>
</template>

<script>
import Vue from 'vue';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import { account } from '../../mixins/account.js';

import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';
import Loader from '../../utils/loader.js';

import addresses from '../../data/addresses.json';

export default {
	mixins: [
		account,
	],
	data() {
		return {
			platformId: '',
			setId: '',
			balance: {},
			components: {},
			prices: {},
		};
	},
	computed: {
		set() {
			if (Object.keys(this.balance).length == 0) {
				return;
			}
			const price = this._getPrice(this.components);
			if (!price) {
				return;
			}
			const setId = this.setId;
			const platformId = this.platformId;
			const amount = Converter.toAmount(this.balance, 'eth');
			const amountNumber = new BigNumber(amount);
			const value = amountNumber.times(price).toString();
			const set = {
				setId,
				platformId,
				amount,
				price,
				value,
			};
			return set;
		},
	},
	async mounted() {
		if (!this.account.address) {
			this.$router.push('/login');
			return;
		}
		this.platformId = this.$route.params.platformId;
		this.setId = this.$route.params.setId;
		await this._loadSet();
		this._loadPrices();
	},
	methods: {
		getUnderlyingAmount(component) {
			const componentAmount = component.amount;
			const componentAmountNumber = new BigNumber(componentAmount);
			const setAmount = this.set.amount;
			return componentAmountNumber.times(setAmount);
		},
		formatAsset(assetId) {
			return Formatter.formatAsset(assetId);
		},
		formatSet(setId) {
			return Formatter.formatSet(setId);
		},
		formatSetName(setId) {
			return Formatter.formatSetName(setId);
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
		async _loadSet() {
			if (this.platformId == 'tokensets') {
				await this._loadTokenSet();
			}
		},
		async _loadPrices() {
			const assets = [];
			for (const component of this.components) {
				const assetId = component.assetId;
				assets.push(assetId);
			}
			const prices = await Loader.loadPrice(assets);
			for (let i = 0; i < assets.length; i++) {
				const assetId = assets[i];
				const price = prices[assetId];
				Vue.set(this.prices, assetId, price);
			}
		},
		async _loadTokenSet() {
			const address = this.account.address.toLowerCase();
			const data = await Loader.loadTokenSets(address);
			if (data.users.length == 0) {
				return;
			}
			const addressMap = Converter.reverseMap(addresses);
			const sets = data.users[0].balances;

			for (const set of sets) {
				const setId = set.set_.set_.symbol.toLowerCase();
				if (this.setId != setId) {
					continue;
				}
				const setBalance = set.balance;
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
				this.balance = setBalance;
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

#name {
	margin-top: 2em;
}

#amount {
	font-size: 3em;
	font-weight: bold;
}

#value,
#underlying {
	font-size: 1.15em;
}

.component:not(:last-child)::after {
	content: "+";
}
</style>
