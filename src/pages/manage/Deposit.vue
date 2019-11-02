<template>
	<div>
		<h2>Manage deposits</h2>
		<div>
			<div class="list">
				<div v-for="asset in assets" class="asset-selector" :class="{ 'selected': asset == assetId }" @click="selectAsset(asset)">
					{{ formatAsset(asset) }}
				</div>
			</div>
		</div>
		<div>
			<div class="list">
				<div v-for="platform in platforms" class="app-selector" :class="{ 'selected': platform == platformId }" @click="selectPlatform(platform)">
					<div>{{ formatPlatform(platform) }}</div>
					<div>{{ formatRate(rates[platform][assetId]) }}</div>
				</div>
			</div>
		</div>
		<div id="action-selector-wrapper">
			<span class="action-selector" @click="selectAction('deposit')" :class="{ 'selected': action == 'deposit' }">Deposit</span>
			<span class="action-selector" @click="selectAction('withdraw')" :class="{ 'selected': action == 'withdraw' }">Withdraw</span>
		</div>
		<div id="amount-wrapper">
			<span class="input-group">
				<span class="max-label" @click="setMax()">MAX</span>
				<input class="amount" v-model="assetAmount">
				<span class="label label-ghost label-right inline">{{ formatAsset(assetId) }}</span>
			</span>
		</div>
		<div id="button-wrapper">
			<button class="primary big" @click="deposit()" v-if="action == 'deposit'">Deposit</button>
			<button class="primary big" @click="withdraw()" v-if="action == 'withdraw'">Withdraw</button>
		</div>
		<TxStatus :status="txStatus" :onHidden="hideStatus"/>
	</div>
</template>

<script>
import Vue from 'vue';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import TxStatus from '../../components/TxStatus.vue';

import erc20Abi from '../../data/abi/erc20.json';
import compoundTokenAbi from '../../data/abi/compoundToken.json';
import dydxAbi from '../../data/abi/dydx.json';
import fulcrumTokenAbi from '../../data/abi/fulcrumInterestToken.json';

import tickers from '../../data/tickers.json';
import decimals from '../../data/decimals.json';
import addresses from '../../data/addresses.json';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const dydxAddress = '0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e';

export default {
	components: {
		TxStatus,
	},
	data() {
		return {
			account: undefined,
			assetId: 'dai',
			platformId: 'compound',
			action: 'deposit',
			assetAmount: '100',
			rates: {
				compound: {},
				dydx: {},
				fulcrum: {},
			},
			indices: {
				compound: {},
				dydx: {},
				fulcrum: {},
			},
			tokenAddresses: {
				compound: {},
				dydx: {},
				fulcrum: {},
			},
			balances: {
				compound: {},
				dydx: {},
				fulcrum: {},
			},
			txStatus: 'none',
		}
	},
	mounted() {
		this._loadAccount();
		if (!this.account) {
			this.$router.push('/login');
			return;
		}
		this._loadRouterState();
		this._loadCompound();
		this._loadDydx();
		this._loadFulcrum();
	},
	methods: {
		selectAsset(asset) {
			this.assetId = asset;
		},
		selectPlatform(platform) {
			this.platformId = platform;
		},
		selectAction(action) {
			this.action = action;
		},
		hideStatus() {
			this.txStatus = 'none';
		},
		deposit() {
			if (this.platformId == 'compound') {
				this._depositCompound();
			}
			if (this.platformId == 'dydx') {
				this._depositDydx();
			}
			if (this.platformId == 'fulcrum') {
				this._depositFulcrum();
			}
		},
		withdraw() {
			if (this.platformId == 'compound') {
				this._withdrawCompound();
			}
			if (this.platformId == 'dydx') {
				this._withdrawDydx();
			}
			if (this.platformId == 'fulcrum') {
				this._withdrawFulcrum();
			}
		},
		formatAsset(assetId) {
			const ticker = tickers[assetId];
			return ticker;
		},
		formatPlatform(platformId) {
			const platformMap = {
				'compound': 'Compound',
				'dydx': 'dYdX',
				'fulcrum': 'Fulcrum',
			};
			const platform = platformMap[platformId];
			return platform;
		},
		formatRate(rateString) {
			if (!rateString) {
				return '…';
			}
			const rate = new BigNumber(rateString);
			return `${rate.times(100).toFixed(2)}%`;
		},
		async setMax() {
			const account = this.account.address;
			if (this.action == 'deposit') {
				if (this.assetId != 'eth') {
					const inputAddress = addresses[this.assetId];
					const inputToken = new ethers.Contract(inputAddress, erc20Abi, provider);
					const inputTokenBalance = await inputToken.balanceOf(account);
					const assetAmount = this._toAmount(inputTokenBalance.toString(), this.assetId);
					this.assetAmount = assetAmount;
				}
			}
			if (this.action == 'withdraw') {
				const tokenBalance = this.balances[this.platformId][this.assetId];
				if (!tokenBalance) {
					this.assetAmount = '0';
					return;
				}
				const tokenBalanceNumber = new BigNumber(tokenBalance);
				const index = this.indices[this.platformId][this.assetId];
				const amountNumber = tokenBalanceNumber.times(index).div('1e18');
				const amount = amountNumber.toFixed(0);
				const assetAmount = this._toAmount(amount, this.assetId);
				this.assetAmount = assetAmount;
			}
		},
		_loadAccount() {
			const address = localStorage.getItem('address');
			const auth = localStorage.getItem('auth') == 'true';
			if (!address || !auth) {
				return;
			}
			this.account = {
				address,
				auth,
			};
		},
		_loadRouterState() {
			const routerState = this.$router.state;
			if (routerState) {
				if (routerState.assetId) {
					this.assetId = routerState.assetId;
				}
				if (routerState.platformId) {
					this.platformId = routerState.platformId;
				}
				if (routerState.action) {
					this.action = routerState.action;
				}
			}
		},
		async _depositCompound() {
			const assetAddress = addresses[this.assetId];
			const cTokenAddress = this.tokenAddresses.compound[this.assetId];
			const cToken = new ethers.Contract(cTokenAddress, compoundTokenAbi, signer);
			const mintBalance = this._toBalance(this.assetAmount, this.assetId);
			await this._checkAllowance(cTokenAddress, assetAddress, mintBalance);
			try {
				this.txStatus = 'mining';
				const tx = await cToken.mint(mintBalance);
				const txReceipt = await provider.getTransactionReceipt(tx.hash);
				if (txReceipt.status == 1) {
					this.txStatus = 'success';
				} else {
					this.txStatus = 'failure';
				}
			} catch(e) {
				this.txStatus = 'rejected';
			}
		},
		async _depositDydx() {
			const account = this.account.address;
			const marketId = this._getDydxMarket(this.assetId);
			const assetAddress = addresses[this.assetId];
			const dydx = new ethers.Contract(dydxAddress, dydxAbi, signer);
			const depositBalance = this._toBalance(this.assetAmount, this.assetId);
			await this._checkAllowance(dydxAddress, assetAddress, depositBalance);
			try {
				this.txStatus = 'mining';
				const accounts = [{
					owner: account,
					number: 0,
				}];
				const actions = [{
					actionType: 0,
					accountId: 0,
					amount: {
						sign: true,
						denomination: 0,
						ref: 0,
						value: depositBalance,
					},
					primaryMarketId: marketId,
					secondaryMarketId: 0,
					otherAddress: account,
					otherAccountId: 0,
					data: '0x',
				}];
				const tx = await dydx.operate(accounts, actions);
				const txReceipt = await provider.getTransactionReceipt(tx.hash);
				if (txReceipt.status == 1) {
					this.txStatus = 'success';
				} else {
					this.txStatus = 'failure';
				}
			} catch(e) {
				this.txStatus = 'rejected';
			}
		},
		async _depositFulcrum() {
			const assetAddress = addresses[this.assetId];
			const iTokenAddress = this.tokenAddresses.fulcrum[this.assetId];
			const iToken = new ethers.Contract(iTokenAddress, fulcrumTokenAbi, signer);
			const account = this.account.address;
			const mintBalance = this._toBalance(this.assetAmount, this.assetId);
			await this._checkAllowance(iTokenAddress, assetAddress, mintBalance);
			try {
				this.txStatus = 'mining';
				const tx = await iToken.mint(account, mintBalance);
				const txReceipt = await provider.getTransactionReceipt(tx.hash);
				if (txReceipt.status == 1) {
					this.txStatus = 'success';
				} else {
					this.txStatus = 'failure';
				}
			} catch(e) {
				this.txStatus = 'rejected';
			}
		},
		async _withdrawCompound() {
			const assetAddress = addresses[this.assetId];
			const index = this.indices.compound[this.assetId];
			const redeemBalance = this._toBalance(this.assetAmount, this.assetId);
			const redeemBalanceNumber = new BigNumber(redeemBalance);
			const tokenBalanceNumber = redeemBalanceNumber.times('1e18').div(index);
			const tokenBalance = tokenBalanceNumber.toFixed(0);
			const cTokenAddress = this.tokenAddresses.compound[this.assetId];
			const cToken = new ethers.Contract(cTokenAddress, compoundTokenAbi, signer);
			try {
				this.txStatus = 'mining';
				const tx = await cToken.redeem(tokenBalance);
				const txReceipt = await provider.getTransactionReceipt(tx.hash);
				if (txReceipt.status == 1) {
					this.txStatus = 'success';
				} else {
					this.txStatus = 'failure';
				}
			} catch(e) {
				this.txStatus = 'rejected';
			}
		},
		async _withdrawDydx() {
			const account = this.account.address;
			const marketId = this._getDydxMarket(this.assetId);
			const assetAddress = addresses[this.assetId];
			const dydx = new ethers.Contract(dydxAddress, dydxAbi, signer);
			const depositBalance = this._toBalance(this.assetAmount, this.assetId);
			await this._checkAllowance(dydxAddress, assetAddress, depositBalance);
			try {
				this.txStatus = 'mining';
				const accounts = [{
					owner: account,
					number: 0,
				}];
				const actions = [{
					actionType: 1,
					accountId: 0,
					amount: {
						sign: false,
						denomination: 0,
						ref: 0,
						value: depositBalance,
					},
					primaryMarketId: marketId,
					secondaryMarketId: 0,
					otherAddress: account,
					otherAccountId: 0,
					data: '0x',
				}];
				const tx = await dydx.operate(accounts, actions);
				const txReceipt = await provider.getTransactionReceipt(tx.hash);
				if (txReceipt.status == 1) {
					this.txStatus = 'success';
				} else {
					this.txStatus = 'failure';
				}
			} catch(e) {
				this.txStatus = 'rejected';
			}
		},
		async _withdrawFulcrum() {
			const account = this.account.address;
			const assetAddress = addresses[this.assetId];
			const index = this.indices.fulcrum[this.assetId];
			const burnBalance = this._toBalance(this.assetAmount, this.assetId);
			const burnBalanceNumber = new BigNumber(burnBalance);
			const tokenBalanceNumber = burnBalanceNumber.times('1e18').div(index);
			const tokenBalance = tokenBalanceNumber.toFixed(0);
			const iTokenAddress = this.tokenAddresses.fulcrum[this.assetId];
			const iToken = new ethers.Contract(iTokenAddress, fulcrumTokenAbi, signer);
			try {
				this.txStatus = 'mining';
				const tx = await iToken.burn(account, tokenBalance);
				const txReceipt = await provider.getTransactionReceipt(tx.hash);
				if (txReceipt.status == 1) {
					this.txStatus = 'success';
				} else {
					this.txStatus = 'failure';
				}
			} catch(e) {
				this.txStatus = 'rejected';
			}
		},
		async _checkAllowance(spender, address, amount) {
			const uintMax = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
			const account = this.account.address;
			const inputToken = new ethers.Contract(address, erc20Abi, signer);
			const inputTokenAllowance = await inputToken.allowance(account, spender);
			if (inputTokenAllowance.gte(amount)) {
				return;
			}
			try {
				this.txStatus = 'mining';
				const tx = await inputToken.approve(spender, uintMax);
				const txReceipt = await provider.getTransactionReceipt(tx.hash);
				if (txReceipt.status == 1) {
					this.txStatus = 'success';
				} else {
					this.txStatus = 'failure';
				}
			} catch(e) {
				this.txStatus = 'rejected';
			}
		},
		async _loadCompound() {
			const url = "https://api.thegraph.com/subgraphs/name/destiner/compound";
			const query = `
				query {
					tokens {
						symbol
						address
						supplyRate
						supplyIndex
					}
					userBalances(where: {
						id: "${this.account.address}"
					}) {
						balances {
							token {
								symbol
							}
							balance
						}
					}
				}`;
			const opts = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query }),
			};
			const response = await fetch(url, opts);
			const json = await response.json();
			const data = json.data;
			const tokens = data.tokens;
			for (const token of tokens) {
				const assetId = token.symbol.substr(1).toLowerCase();
				const address = token.address;
				const rawRate = token.supplyRate;
				const index = token.supplyIndex;
				const rawRateNumber = new BigNumber(rawRate);
				const rateNumber = rawRateNumber.times('2102400').div('1e18');
				const rate = rateNumber.toString();
				Vue.set(this.tokenAddresses.compound, assetId, address);
				Vue.set(this.rates.compound, assetId, rate);
				Vue.set(this.indices.compound, assetId, index);
			}
			if (data.userBalances.length == 0) {
				return;
			}
			const userBalances = data.userBalances[0].balances;
			for (const userBalance of userBalances) {
				const assetId = userBalance.token.symbol.substr(1).toLowerCase();
				const balance = userBalance.balance;
				Vue.set(this.balances.compound, assetId, balance);
			}
		},
		async _loadDydx() {
			const url = "https://api.thegraph.com/subgraphs/name/destiner/dydx";
			const query = `
				query {
					markets {
						token {
							id
							symbol
						}
						supplyIndex
						supplyRate
					}
					users(where: {
						id: "${this.account.address}"
					}) {
						balances {
							balance
							market {
								token {
									symbol
								}
							}
						}
					}
				}`;
			const opts = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query })
			};
			const response = await fetch(url, opts);
			const json = await response.json();
			const data = json.data;
			for (const market of markets) {
				const assetId = market.token.symbol.substr(1).toLowerCase();
				const address = market.token.id;
				const rawRate = market.supplyRate;
				const index = market.supplyIndex;
				const rawRateNumber = new BigNumber(rawRate);
				const rateNumber = rawRateNumber.div('1e18').div('1e2');
				const rate = rateNumber.toString();
				Vue.set(this.tokenAddresses.dydx, assetId, address);
				Vue.set(this.rates.dydx, assetId, rate);
				Vue.set(this.indices.dydx, assetId, index);
			}
			if (data.users.length == 0) {
				return;
			}
			const userBalances = data.users[0].balances;
			for (const userBalance of userBalances) {
				const assetId = userBalance.market.token.symbol.substr(1).toLowerCase();
				const balance = userBalance.balance;
				Vue.set(this.balances.dydx, assetId, balance);
			}
		},
		async _loadFulcrum() {
			const url = "https://api.thegraph.com/subgraphs/name/destiner/fulcrum";
			const query = `
				query {
					tokens {
						symbol
						address
						index
						supplyRate
					}
					userBalances(where: {
						id: "${this.account.address}"
					}) {
						balances {
							token {
								symbol
							}
							balance
						}
					}
				}`;
			const opts = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query })
			};
			const response = await fetch(url, opts);
			const json = await response.json();
			const data = json.data;
			const tokens = data.tokens;
			for (const token of tokens) {
				const assetId = token.symbol.substr(1).toLowerCase();
				const address = token.address;
				const rawRate = token.supplyRate;
				const index = token.index;
				const rawRateNumber = new BigNumber(rawRate);
				const rateNumber = rawRateNumber.div('1e18').div('1e2');
				const rate = rateNumber.toString();
				Vue.set(this.tokenAddresses.fulcrum, assetId, address);
				Vue.set(this.rates.fulcrum, assetId, rate);
				Vue.set(this.indices.fulcrum, assetId, index);
			}
			if (data.userBalances.length == 0) {
				return;
			}
			const userBalances = data.userBalances[0].balances;
			for (const userBalance of userBalances) {
				const assetId = userBalance.token.symbol.substr(1).toLowerCase();
				const balance = userBalance.balance;
				Vue.set(this.balances.fulcrum, assetId, balance);
			}
		},
		_toAmount(amount, assetId) {
			const ten = new BigNumber(10);
			const tickerDecimals = decimals[assetId];
			const multiplier = ten.pow(tickerDecimals);
			const amountNumber = new BigNumber(amount);
			const shortAmountNumber = amountNumber.div(multiplier);
			const shortAmount = shortAmountNumber.toString();
			return shortAmount;
		},
		_toBalance(amount, assetId) {
			const ten = new BigNumber(10);
			const tickerDecimals = decimals[assetId];
			const multiplier = ten.pow(tickerDecimals);
			const amountNumber = new BigNumber(amount);
			const longAmountNumber = amountNumber.times(multiplier);
			const longAmount = longAmountNumber.toFixed(0);
			return longAmount;
		},
		_getDydxMarket(assetId) {
			const markets = {
				'eth': 0,
				'dai': 1,
				'usdc': 2,
			};
			return markets[assetId];
		},
	},
	computed: {
		assets() {
			return [ 'dai', 'usdc', ];
		},
		platforms() {
			return [ 'compound', 'dydx', 'fulcrum', ];
		},
	},
}
</script>

<style scoped>
#action-selector-wrapper {
	margin-top: 0.5em;
}

#amount-wrapper {
	margin-top: 3em;
}

#button-wrapper {
	margin-top: 1em;
}

.list {
	display: flex;
}
</style>
