<template>
	<section>
		<div>
			<div id="total-value">
				Net worth: {{ formatMoney(totalBalance) }}
			</div>

			<div id="wallet-list">
				<div id="wallet-list-header">
					Wallets
				</div>
				<div
					v-for="(wallet, walletId) in wallets"
					:key="wallet.address"
					class="wallet"
				>
					<div class="wallet-data">
						<WalletIcon :id="walletId" />
						<div class="wallet-details">
							<div class="wallet-address">
								{{ formatWalletAddress(wallet.address) }}
							</div>
							<div class="wallet-value">
								{{ formatMoney(walletBalance(walletId)) }}
							</div>
						</div>
					</div>
					<img
						:src="crossIcon"
						@click="removeWallet(wallet)"
					>
				</div>
				<div
					id="add-wallet"
					@click="openNewWallet()"
				>
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
		</div>
	</section>
</template>

<script>
import crossIcon from '../../../public/img/cross.svg';
import plusIcon from '../../../public/img/plus.svg';

import WalletIcon from '../WalletIcon.vue';

import Balance from '../../utils/balance.js';
import Formatter from '../../utils/formatter.js';
import Storage from '../../utils/storage.js';
import Wallets from '../../utils/wallets.js';

export default {
	components: {
		WalletIcon,
	},
	props: {
		wallets: {
			type: Array,
			default: () => [],
		},
		components: {
			type: Object,
			default: () => {},
		},
		prices: {
			type: Object,
			default: () => {},
		},
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
		totalBalance() {
			if (this.wallets.length == 0) {
				return '0';
			}
			const balance = Balance.getTotal(
				this.assets,
				this.deposits,
				this.investments,
				this.components,
				this.prices
			);
			return balance.toString();
		},
		crossIcon() {
			return crossIcon;
		},
		plusIcon() {
			return plusIcon;
		},
	},
	methods: {
		walletBalance(walletId) {
			const walletAssets = this.assets
				.filter(asset => asset.walletId == walletId);
			const walletDeposits = this.deposits
				.filter(deposit => deposit.walletId == walletId);
			const walletInvestments = this.investments
				.filter(investment => investment.walletId == walletId);
			const walletBalance = Balance.getTotal(
				walletAssets,
				walletDeposits,
				walletInvestments,
				this.components,
				this.prices
			);
			return walletBalance.toString();
		},
		formatMoney(moneyString) {
			return Formatter.formatMoney(moneyString);
		},
		formatWalletAddress(address) {
			return Formatter.formatAddress(address);
		},
		removeWallet(wallet) {
			Storage.removeWallet(wallet);
			this.$router.go();
		},
		openNewWallet() {
			const path = '/wallet/new';
			this.$router.push(path);
		},
	},
};
</script>

<style scoped>
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
	cursor: pointer;
}

.wallet {
	justify-content: space-between;
}

#add-wallet-icon {
	display: flex;
	height: 2em;
	width: 2em;
	align-items: center;
	justify-content: center;
	border-radius: 1em;
	background: #d6d6d6;
}

.wallet-data {
	display: flex;
	align-items: center;
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

#add-wallet-icon > img {
	height: 1em;
	width: 1em;
}

#add-wallet-subtitle {
	font-size: 0.875em;
	color: #666;
}
</style>
