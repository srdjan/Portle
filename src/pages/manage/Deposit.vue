<template>
	<div>
		<h2>Manage deposits</h2>
		<div>
			<div class="list">
				<div
					v-for="asset in assets"
					:key="asset"
					class="asset-selector"
					:class="{ 'selected': asset == assetId }"
					@click="selectAsset(asset)"
				>
					{{ formatAsset(asset) }}
				</div>
			</div>
		</div>
		<div>
			<div class="list">
				<div
					v-for="platform in platforms"
					:key="platform"
					class="app-selector"
					:class="{ 'selected': platform == platformId }"
					@click="selectPlatform(platform)"
				>
					<div>{{ formatPlatform(platform) }}</div>
					<div>{{ formatRate(rates[platform][assetId]) }}</div>
				</div>
			</div>
		</div>
		<div id="action-selector-wrapper">
			<span
				class="action-selector"
				:class="{ 'selected': action == 'deposit' }"
				@click="selectAction('deposit')"
			>
				Deposit
			</span>
			<span
				class="action-selector"
				:class="{ 'selected': action == 'withdraw' }"
				@click="selectAction('withdraw')"
			>
				Withdraw
			</span>
		</div>
		<div id="amount-wrapper">
			<AssetInput
				:id="assetId"
				:amount="assetAmount"
				:disabled="!loaded"
				:set-max="setMax"
				:on-change="onAssetChange"
			/>
		</div>
		<div id="button-wrapper">
			<div
				v-if="action == 'deposit'"
			>
				<button
					v-if="locked"
					:disabled="!loaded"
					class="primary big"
					@click="unlock()"
				>
					Unlock
				</button>

				<button
					v-else
					:disabled="!loaded"
					class="primary big"
					@click="deposit()"
				>
					Deposit
				</button>
			</div>

			<button
				v-if="action == 'withdraw'"
				:disabled="!loaded"
				class="primary big"
				@click="withdraw()"
			>
				Withdraw
			</button>
		</div>
		<TxStatus
			:status="txStatus"
			:on-hidden="hideStatus"
		/>
	</div>
</template>

<script>
import Vue from 'vue';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import TxStatus from '../../components/TxStatus.vue';
import AssetInput from '../../components/AssetInput.vue';

import { sendTx } from '../../mixins/sendTx.js';
import { account } from '../../mixins/account.js';

import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';
import Loader from '../../utils/loader.js';

import erc20Abi from '../../data/abi/erc20.json';
import allowanceOracleAbi from '../../data/abi/allowanceOracle.json';
import compoundTokenAbi from '../../data/abi/compoundToken.json';
import dydxAbi from '../../data/abi/dydx.json';
import fulcrumTokenAbi from '../../data/abi/fulcrumInterestToken.json';

import addresses from '../../data/addresses.json';

const web3 = window.ethereum || window.web3;

let provider;
let signer;
if (web3) {
	provider = new ethers.providers.Web3Provider(web3);
	signer = provider.getSigner();
}

const allowanceOracleAddress = '0xB44bFbD3d55808222f0F44fE53b731d5003582cd';
const dydxAddress = '0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e';

export default {
	components: {
		TxStatus,
		AssetInput,
	},
	mixins: [
		sendTx,
		account,
	],
	data() {
		return {
			assetId: 'dai',
			platformId: 'compound',
			action: 'deposit',
			assetAmount: '0',
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
				fulcrum: {},
			},
			balances: {
				compound: {},
				dydx: {},
				fulcrum: {},
			},
			allowances: {
				compound: {},
				dydx: {},
				fulcrum: {},
			},
			txStatus: 'none',
		};
	},
	computed: {
		assets() {
			return [ 'dai', 'usdc', ];
		},
		platforms() {
			return [ 'compound', 'dydx', 'fulcrum', ];
		},
		loaded() {
			const rates = this.rates[this.platformId][this.assetId];
			const balances = this.balances[this.platformId][this.assetId];
			const allowance = this.allowances[this.platformId][this.assetId];
			return rates && balances && allowance;
		},
		locked() {
			const requiredAllowance = Converter.toBalance(this.assetAmount, this.assetId);
			const requiredAllowanceNumber = new BigNumber(requiredAllowance);
			const allowance = this.allowances[this.platformId][this.assetId];
			const allowanceNumber = new BigNumber(allowance);
			return allowanceNumber.isNaN()
				|| allowanceNumber.isZero()
				|| allowanceNumber.lt(requiredAllowanceNumber);
		},
	},
	async mounted() {
		if (!this.account.address || !this.account.auth) {
			this.$router.push('/login');
			return;
		}
		this._loadRouterState();
		await this._loadDeposits();
		this._loadAllowances();
	},
	methods: {
		selectAsset(asset) {
			this.assetId = asset;
			this._setDefaultAmount();
		},
		selectPlatform(platform) {
			this.platformId = platform;
			this._setDefaultAmount();
		},
		selectAction(action) {
			this.action = action;
			this._setDefaultAmount();
		},
		hideStatus() {
			this.txStatus = 'none';
		},
		async unlock() {
			const uintMax = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
			const assetAddress = addresses[this.assetId];
			const spenderMap = {
				'compound': this.tokenAddresses.compound[this.assetId],
				'dydx': dydxAddress,
				'fulcrum': this.tokenAddresses.fulcrum[this.assetId],
			};
			const spender = spenderMap[this.platformId];
			const txResult = await this._unlock(assetAddress, spender);
			if (txResult) {
				Vue.set(this.allowances[this.platformId], this.assetId, uintMax);
			}
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
			return Formatter.formatAsset(assetId);
		},
		formatPlatform(platformId) {
			return Formatter.formatPlatform(platformId);
		},
		formatRate(rateString) {
			return Formatter.formatRate(rateString);
		},
		async setMax() {
			const account = this.account.address;
			if (this.action == 'deposit') {
				if (this.assetId != 'eth') {
					const inputAddress = addresses[this.assetId];
					const inputToken = new ethers.Contract(inputAddress, erc20Abi, provider);
					const inputTokenBalance = await inputToken.balanceOf(account);
					const assetAmount = Converter.toAmount(inputTokenBalance.toString(), this.assetId);
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
				const assetAmount = Converter.toAmount(amount, this.assetId);
				this.assetAmount = assetAmount;
			}
		},
		onAssetChange(id, amount) {
			this.assetId = id;
			this.assetAmount = amount;
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
		async _loadDeposits() {
			const depositPromises = [
				this._loadCompound(),
				this._loadDydx(),
				this._loadFulcrum(),
			];
			await Promise.all(depositPromises);
		},
		async _loadAllowances() {
			const address = this.account.address.toLowerCase();
			const requests = [{
				token: addresses['dai'],
				spender: this.tokenAddresses.compound['dai'],
			}, {
				token: addresses['dai'],
				spender: dydxAddress,
			}, {
				token: addresses['dai'],
				spender: this.tokenAddresses.fulcrum['dai'],
			}, {
				token: addresses['usdc'],
				spender: this.tokenAddresses.compound['usdc'],
			}, {
				token: addresses['usdc'],
				spender: dydxAddress,
			}, {
				token: addresses['usdc'],
				spender: this.tokenAddresses.fulcrum['usdc'],
			}];
			const allowanceOracle = new ethers.Contract(allowanceOracleAddress, allowanceOracleAbi, provider);
			const allowances = await allowanceOracle.allowance(address, requests);

			Vue.set(this.allowances.compound, 'dai', allowances[0].toString());
			Vue.set(this.allowances.dydx, 'dai', allowances[1].toString());
			Vue.set(this.allowances.fulcrum, 'dai', allowances[2].toString());
			Vue.set(this.allowances.compound, 'usdc', allowances[3].toString());
			Vue.set(this.allowances.dydx, 'usdc', allowances[4].toString());
			Vue.set(this.allowances.fulcrum, 'usdc', allowances[5].toString());
		},
		_setDefaultAmount() {
			this.assetAmount = '0';
		},
		async _unlock(token, spender) {
			const uintMax = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
			const inputToken = new ethers.Contract(token, erc20Abi, signer);
			const txPromise = inputToken.approve(spender, uintMax);
			return await this._sendTx(provider, txPromise);
		},
		async _depositCompound() {
			await this._unlockAccount();
			const cTokenAddress = this.tokenAddresses.compound[this.assetId];
			const cToken = new ethers.Contract(cTokenAddress, compoundTokenAbi, signer);
			const mintBalance = Converter.toBalance(this.assetAmount, this.assetId);
			const txPromise = cToken.mint(mintBalance);
			await this._sendTx(provider, txPromise);
		},
		async _depositDydx() {
			const account = await this._unlockAccount();
			const marketId = this._getDydxMarket(this.assetId);
			const dydx = new ethers.Contract(dydxAddress, dydxAbi, signer);
			const depositBalance = Converter.toBalance(this.assetAmount, this.assetId);
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
			const txPromise = dydx.operate(accounts, actions);
			await this._sendTx(provider, txPromise);
		},
		async _depositFulcrum() {
			const account = await this._unlockAccount();
			const iTokenAddress = this.tokenAddresses.fulcrum[this.assetId];
			const iToken = new ethers.Contract(iTokenAddress, fulcrumTokenAbi, signer);
			const mintBalance = Converter.toBalance(this.assetAmount, this.assetId);
			const txPromise = iToken.mint(account, mintBalance);
			await this._sendTx(provider, txPromise);
		},
		async _withdrawCompound() {
			await this._unlockAccount();
			const index = this.indices.compound[this.assetId];
			const redeemBalance = Converter.toBalance(this.assetAmount, this.assetId);
			const redeemBalanceNumber = new BigNumber(redeemBalance);
			const tokenBalanceNumber = redeemBalanceNumber.times('1e18').div(index);
			const tokenBalance = tokenBalanceNumber.toFixed(0);
			const cTokenAddress = this.tokenAddresses.compound[this.assetId];
			const cToken = new ethers.Contract(cTokenAddress, compoundTokenAbi, signer);
			const txPromise = cToken.redeem(tokenBalance);
			await this._sendTx(provider, txPromise);
		},
		async _withdrawDydx() {
			const account = await this._unlockAccount();
			const marketId = this._getDydxMarket(this.assetId);
			const dydx = new ethers.Contract(dydxAddress, dydxAbi, signer);
			const withdrawBalance = Converter.toBalance(this.assetAmount, this.assetId);
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
					value: withdrawBalance,
				},
				primaryMarketId: marketId,
				secondaryMarketId: 0,
				otherAddress: account,
				otherAccountId: 0,
				data: '0x',
			}];
			const txPromise = dydx.operate(accounts, actions);
			await this._sendTx(provider, txPromise);
		},
		async _withdrawFulcrum() {
			const account = await this._unlockAccount();
			const index = this.indices.fulcrum[this.assetId];
			const burnBalance = Converter.toBalance(this.assetAmount, this.assetId);
			const burnBalanceNumber = new BigNumber(burnBalance);
			const tokenBalanceNumber = burnBalanceNumber.times('1e18').div(index);
			const tokenBalance = tokenBalanceNumber.toFixed(0);
			const iTokenAddress = this.tokenAddresses.fulcrum[this.assetId];
			const iToken = new ethers.Contract(iTokenAddress, fulcrumTokenAbi, signer);
			const txPromise = iToken.burn(account, tokenBalance);
			await this._sendTx(provider, txPromise);
		},
		async _loadCompound() {
			const address = this.account.address.toLowerCase();
			const data = await Loader.loadCompound(address);
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
			const address = this.account.address.toLowerCase();
			const data = await Loader.loadDydx(address);
			const markets = data.markets;
			for (const market of markets) {
				const symbol = market.token.symbol;
				const assetId = symbol == 'WETH'
					? 'eth'
					: symbol.toLowerCase();
				const rawRate = market.supplyRate;
				const index = market.supplyIndex;
				const rawRateNumber = new BigNumber(rawRate);
				const rateNumber = rawRateNumber.div('1e18');
				const rate = rateNumber.toString();
				Vue.set(this.rates.dydx, assetId, rate);
				Vue.set(this.indices.dydx, assetId, index);
			}
			if (data.users.length == 0) {
				return;
			}
			const userBalances = data.users[0].balances;
			for (const userBalance of userBalances) {
				const symbol = userBalance.market.token.symbol;
				const assetId = symbol == 'WETH'
					? 'eth'
					: symbol.toLowerCase();
				const balance = userBalance.balance;
				Vue.set(this.balances.dydx, assetId, balance);
			}
		},
		async _loadFulcrum() {
			const address = this.account.address.toLowerCase();
			const data = await Loader.loadFulcrum(address);
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
		_getDydxMarket(assetId) {
			const markets = {
				'eth': 0,
				'dai': 1,
				'usdc': 2,
			};
			return markets[assetId];
		},
	},
};
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
