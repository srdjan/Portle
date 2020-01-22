<template>
	<section>
		<div id="total-value-wrapper">
			<div id="total-value-label">
				Net worth:
			</div>
			<div id="total-value">
				{{ formatMoney(totalBalance) }}
			</div>
		</div>

		<div id="wallet-list">
			<div id="wallet-list-header">
				Wallets
			</div>
			<div
				v-for="(wallet, walletId) in wallets"
				:key="wallet.address"
				class="wallet"
				:class="{ 'wallet-selected': walletId == selectedWallet }"
				@click="openWallet(wallet.address)"
			>
				<div class="wallet-data">
					<WalletIcon
						:wallet-id="walletId"
						class="wallet-icon"
					/>
					<div class="wallet-details">
						<div class="wallet-address">
							{{ formatWalletAddress(wallet.address) }}
						</div>
						<div class="wallet-value">
							{{ formatMoney(walletBalance(walletId)) }}
						</div>
					</div>
				</div>
				<div class="wallet-actions">
					<img
						:src="clipboardIcon"
						class="copy-address-icon"
						@click="copyWalletAddress(wallet.address)"
					>
					<img
						:src="crossIcon"
						class="remove-wallet-icon"
						@click="removeWallet(wallet)"
					>
				</div>
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
	</section>
</template>

<script>
import clipboardIcon from '../../../public/img/clipboard.svg';
import crossIcon from '../../../public/img/cross.svg';
import plusIcon from '../../../public/img/plus.svg';

import WalletIcon from '../icon/WalletIcon.vue';

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
		selectedWallet: {
			type: Number,
			default: -1,
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
		clipboardIcon() {
			return clipboardIcon;
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
		copyWalletAddress(address) {
			navigator.clipboard.writeText(address);
		},
		removeWallet(wallet) {
			Storage.removeWallet(wallet);
			this.$router.go();
		},
		openWallet(address) {
			const path = `/wallet/${address}`;
			this.$router.push(path);
		},
		openNewWallet() {
			const path = '/wallet/new';
			this.$router.push(path);
		},
	},
};
</script>

<style scoped>
#total-value-wrapper {
	display: flex;
	font-size: 1.125em;
	font-weight: bold;
}

#total-value {
	margin-left: 0.25em;
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
	border-top: 1px solid var(--outline-color);
	display: flex;
	align-items: center;
	cursor: pointer;
}

.wallet {
	justify-content: space-between;
}

.wallet-selected {
	background: var(--brand-color);
	margin: 0 -1em;
	padding: 1.25em 1.5em;
}

.wallet-actions {
	display: none;
}

.wallet:hover > .wallet-actions {
	display: initial;
}

.wallet-actions > img {
	margin-left: 0.5em;
	height: 1.25em;
	width: 1.25em;
	opacity: 0.25;
}

.wallet-actions > img:hover {
	opacity: 0.5;
}

.wallet-selected .wallet-actions > img {
	filter: invert(100%);
}

#add-wallet-icon {
	display: flex;
	height: 2em;
	width: 2em;
	align-items: center;
	justify-content: center;
	border-radius: 1em;
	background: var(--cover-color);
}

.wallet-data {
	display: flex;
	align-items: center;
}

.wallet-icon {
	height: 2em;
	width: 2em;
	opacity: 0.75;
}

.wallet-details,
#add-wallet-text {
	margin-left: 0.75em;
}

.wallet-address {
	font-size: 0.875em;
	color: var(--secondary-text-color);
}

.wallet-value {
	font-size: 1.125em;
	font-weight: bold;
}

.wallet-selected .wallet-address,
.wallet-selected .wallet-value {
	color: var(--inverted-primary-text-color);
}

#add-wallet-icon > img {
	height: 1em;
	width: 1em;
	opacity: 0.5;
}

#add-wallet-subtitle {
	font-size: 0.875em;
	color: var(--secondary-text-color);
}

/* Mobile */

@media all and (max-width: 767px) {
	#total-value-wrapper {
		flex-direction: column;
		font-weight: normal;
	}

	#total-value-label {
		font-size: 0.625rem;
		color: var(--inverted-secondary-text-color);
	}

	#total-value {
		margin-left: 0;
	}

	#wallet-list {
		display: flex;
		margin: 0 0 0 1em;
	}

	#wallet-list-header {
		display: none;
	}

	.wallet,
	#add-wallet {
		height: 2.25em;
		padding: 0;
		border: none;
		margin-left: 0.5em;
	}

	.wallet-selected {
		color: inherit;
		background: none;
		padding: 0;
		margin-right: 0;
	}

	.wallet-icon {
		height: 1em;
		width: 1em;
	}

	.wallet-details,
	#add-wallet-text {
		height: 2.25em;
		margin-left: 0.25em;
		min-width: 5em;
	}

	.wallet-address {
		font-size: 0.625em;
		color: var(--inverted-secondary-text-color);
	}

	.wallet-selected .wallet-value {
		font-weight: bold;
	}

	.wallet-value {
		font-weight: normal;
	}

	.wallet:hover > .wallet-actions {
		display: none;
	}

	#add-wallet {
		margin-right: 1em;
	}

	#add-wallet-icon {
		height: 1em;
		width: 1em;
	}

	#add-wallet-icon > img {
		height: 0.75em;
		width: 0.75em;
	}

	#add-wallet-text {
		display: none;
	}
}
</style>
