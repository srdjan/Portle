<template>
	<div id="view">
		<div id="close">
			<img
				id="icon"
				:src="crossIcon"
				@click="goBack()"
			>
		</div>
		<div id="header">
			<h1 id="title">
				Add new wallet
			</h1>
		</div>
		<div id="wallet-type-list">
			<div
				v-for="walletType in walletTypes"
				:key="walletType.id"
				class="wallet-type"
				:class="{ 'wallet-type-selected': walletType.id == selectedWalletType }"
				@click="pickWalletType(walletType.id)"
			>
				<div>
					<div id="wallet-type-title">
						{{ walletType.title }}
					</div>
					<div id="wallet-type-subtitle">
						{{ walletType.subtitle }}
					</div>
				</div>
			</div>
		</div>

		<div
			v-if="selectedWalletType == 'address'"
			id="input-group"
		>
			<TextField
				v-model="walletId"
				class="input"
				:label="'Address'"
				:invalid="!_isAddressValid(walletId)"
			/>
			<button
				id="add"
				class="big"
				:disabled="!_isAddressValid(walletId) || !walletId"
				@click="saveAddressWallet()"
			>
				Add wallet
			</button>
		</div>
		<div
			v-if="selectedWalletType == 'ens'"
			id="input-group"
		>
			<TextField
				v-model="walletId"
				class="input"
				:label="'ENS name'"
				:invalid="!_isEnsValid(walletId)"
			/>
			<button
				id="add"
				class="primary big"
				:disabled="!_isEnsValid(walletId) || !walletId"
				@click="saveEnsWallet()"
			>
				Add wallet
			</button>
		</div>
		<div
			v-if="selectedWalletType == 'web3'"
			id="input-group"
		>
			<button
				id="add"
				class="primary big"
				:disabled="!isWeb3Available"
				@click="saveWeb3Wallet()"
			>
				Connect wallet
			</button>
		</div>
		<div id="spacer" />
	</div>
</template>

<script>
import { ethers } from 'ethers';

import TextField from '../components/form/TextField.vue';

import Storage from '../utils/storage.js';

import crossIcon from '../../public/img/cross.svg';

const walletTypes = [{
	id: 'address',
	title: 'Address',
	subtitle: '0xd8dA6BF26…',
}, {
	id: 'ens',
	title: 'ENS',
	subtitle: 'vitalik.eth',
}, {
	id: 'web3',
	title: 'Web3 Wallet',
	subtitle: 'Metamask, Brave, etc',
}];

export default {
	components: {
		TextField,
	},
	data() {
		return {
			selectedWalletType: walletTypes[0].id,
			walletId: '',
		};
	},
	computed: {
		isWeb3Available() {
			return window.ethereum || window.web3;
		},
		crossIcon() {
			return crossIcon;
		},
		walletTypes() {
			return walletTypes;
		},
	},
	watch: {
		selectedWalletType() {
			this.walletId = '';
		}
	},
	methods: {
		goBack() {
			this.$router.back();
		},
		pickWalletType(walletTypeId) {
			this.selectedWalletType = walletTypeId;
		},
		saveAddressWallet() {
			const address = this.walletId;
			this._saveWallet(address);
		},
		async saveEnsWallet() {
			const ens = this.walletId;
			const address = await this._resolveEns(ens);
			this._saveWallet(address);
		},
		async saveWeb3Wallet() {
			// eslint-disable-next-line no-undef
			const addresses = await ethereum.enable();
			const address = addresses[0];
			this._saveWallet(address);
		},
		_isAddressValid(address) {
			if (address.length == 0) {
				return true;
			}
			if (address.length != 42) {
				return false;
			}
			const addressRegex = /0x[0-9A-Fa-f]{40}/g;
			return addressRegex.test(address);
		},
		_isEnsValid(ens) {
			if (ens.length == 0) {
				return true;
			}
			const tokens = ens.split('.');
			for (const token of tokens) {
				const tokenRegex = /[0-9A-Za-z]+/g;
				if (!tokenRegex.test(token)) {
					return false;
				}
			}
			const root = tokens[tokens.length - 1];
			const validRoots = ['eth', 'xyz'];
			if (!validRoots.includes(root)) {
				return false;
			}
			return true;
		},
		_saveWallet(address) {
			const wallet = {
				address: address.toLowerCase(),
			};
			Storage.addWallet(wallet);
			// Open portfolio page
			const path = '/';
			this.$router.push(path);
		},
		async _resolveEns(ens) {
			this.loading = true;
			const infuraKey = '93e3393c76ed4e1f940d0266e2fdbda2';
			const provider = new ethers.providers.InfuraProvider('mainnet', infuraKey);
			const address = await provider.resolveName(ens);
			this.loading = false;
			return address;
		},
	},
};
</script>

<style scoped>
#view {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}

input[type="radio"] {
	margin: 1em;
}

.input {
	width: 28em;
	margin-right: 2em;
}

#add {
	width: 14rem;
}

#close {
	position: absolute;
	right: 32px;
	top: 96px;
}

#icon {
	height: 32px;
	width: 32px;
	opacity: 0.2;
}

#icon:hover {
	opacity: 0.5;
}

h1#title {
	font-size: 3em;
	font-weight: normal;
}

#wallet-type-list {
	display: flex;
	margin: 3.5em 0 4em 0;
}

.wallet-type {
	display: flex;
	height: 4em;
	width: 12em;
	margin: 0 2em;
	padding-left: 1em;
	align-items: center;
	box-sizing: border-box;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
	border: 2px solid transparent;
	border-radius: 4px;
	cursor: pointer;
}

.wallet-type-selected {
	border: 2px solid var(--accent-color);
}

#wallet-type-title {
	font-size: 1.125em;
}

#wallet-type-subtitle {
	font-size: 0.875em;
	color: var(--secondary-text-color);
	font-style: italic;
}

#input-group {
	display: flex;
}

#spacer {
	height: 4em;
}
</style>
