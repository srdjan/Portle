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
		</div>
	</section>
</template>

<script>
import plusIcon from '../../../public/img/plus.svg';

import WalletIcon from '../WalletIcon.vue';

import Balance from '../../utils/balance.js';
import Formatter from '../../utils/formatter.js';

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
			const assets = [];
			if (this.wallets.length == 0) {
				return assets;
			}
			for (const walletIndex in this.wallets) {
				const walletId = parseInt(walletIndex);
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
			for (const walletIndex in this.wallets) {
				const walletId = parseInt(walletIndex);
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
			for (const walletIndex in this.wallets) {
				const walletId = parseInt(walletIndex);
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
	align-items: center;
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
