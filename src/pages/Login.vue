<template>
	<div id="view">
		<h1 id="title">
			Portle
		</h1>
		<div>
			<span class="input-group">
				<input
					id="input"
					v-model="input"
					:class="{ invalid: !isInputValid }"
					class="address"
					placeholder="Enter address or ENS"
				>
				<span
					id="watch"
					:class="{ disabled: isWatchButtonDisabled || loading }"
					@click="watch()"
				>
					<span v-if="loading">Loading…</span>
					<span v-else>Watch</span>
				</span>
			</span>
		</div>
		<div id="divider">
			or
		</div>
		<button
			id="main"
			class="primary big"
			:disabled="!isWeb3Available"
			@click="login()"
		>
			Log in with Ethereum
		</button>
		<div id="placeholder" />
	</div>
</template>

<script>
import { ethers } from 'ethers';

export default {
	data() {
		return {
			input: '',
			loading: false,
		};
	},
	computed: {
		isInputValid() {
			if (this._isAddressValid(this.input)) {
				return true;
			}
			if (this._isEnsValid(this.input)) {
				return true;
			}
			return false;
		},
		isWatchButtonDisabled() {
			if (this.input.length == 0) {
				return true;
			}
			return !this.isInputValid;
		},
		isWeb3Available() {
			const web3 = window.ethereum || window.web3;
			return web3;
		},
	},
	mounted() {
		const address = localStorage.getItem('address');
		if (address) {
			this.$router.push('/');
		}
	},
	methods: {
		async login() {
			// eslint-disable-next-line no-undef
			const addresses = await ethereum.enable();
			const address = addresses[0];
			localStorage.setItem('address', address);
			localStorage.setItem('auth', true);
			this.$router.push('/');
		},
		async watch() {
			const addressRegex = /0x[0-9A-Fa-f]{40}/g;
			const address = addressRegex.test(this.input)
				? this.input
				: await this._resolveEns(this.input);
			if (!address) {
				return;
			}
			localStorage.setItem('address', address);
			localStorage.setItem('auth', false);
			this.$router.push('/');
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
h1#title {
	margin: 1.5em;
	font-size: 2em;
}

div#view {
	height: 100vh;
	display: flex;
	flex-direction:column;
	justify-content: center;
	align-items: center;
}

div#placeholder {
	height: 200px;
}

input#input {
	margin-left: 0.5em;
}

button#main {
	margin-top: 0.5em;
}

.input-group {
	padding: 0.5em 0;
	background: white;
}

#watch {
	margin-left: 1em;
	padding: 0.5em 1.25em 0.5em 1.25em;
	border-left: 1px solid #f2f2f2;
	cursor: pointer;
}

#watch.disabled {
	pointer-events: none;
}

#watch:hover {
	background: #f2f2f2;
}

#divider {
	margin-top: 1em;
}

/* Mobile */

@media all and (max-width: 767px) {
	#watch {
		margin-left: 0;
	}
}
</style>
