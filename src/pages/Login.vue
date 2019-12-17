<template>
	<div id="view">
		<h1 id="title">
			Portle
		</h1>
		<div>
			<span class="input-group">
				<input
					id="address"
					v-model="address"
					:class="{ invalid: !isAddressValid }"
					class="address"
					placeholder="Enter address"
				>
				<span
					id="watch"
					:class="{ disabled: isWatchButtonDisabled }"
					@click="watch()"
				>
					Watch
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
export default {
	data() {
		return {
			address: '',
		};
	},
	computed: {
		isAddressValid() {
			if (this.address.length == 0) {
				return true;
			}
			if (this.address.length != 42) {
				return false;
			}
			const addressRegex = /0x[0-9A-Fa-f]{40}/g;
			return addressRegex.test(this.address);
		},
		isWatchButtonDisabled() {
			if (this.address.length == 0) {
				return true;
			}
			return !this.isAddressValid;
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
		watch() {
			const address = this.address;
			localStorage.setItem('address', address);
			localStorage.setItem('auth', false);
			this.$router.push('/');
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

input#address {
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
</style>
