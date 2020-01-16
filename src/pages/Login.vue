<template>
	<div id="view">
		<div id="header">
			<h1 id="title">
				Portle
			</h1>
			<h2 id="subtitle">
				Decentralized finance portfolio management
			</h2>
		</div>
		<button
			id="main"
			class="primary big"
			@click="openNewWallet()"
		>
			Get started
		</button>
		<div id="spacer" />
	</div>
</template>

<script>
import Storage from '../utils/storage.js';

export default {
	mounted() {
		const walletList = Storage.getWalletList();
		if (walletList.length > 0) {
			this.$router.push('/');
			return;
		}
	},
	methods: {
		openNewWallet() {
			const path = '/wallet/new';
			this.$router.push(path);
		},
	},
};
</script>

<style scoped>
#view {
	height: 95vh;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}

#header {
	margin-bottom: 4em;
	display: flex;
	flex-direction: column;
	align-items: center;
}

h1#title {
	margin-bottom: 0.125em;
	font-size: 3em;
	font-weight: normal;
}

h2#subtitle {
	font-size: 1.5em;
	font-weight: normal;
	margin-top: 0;
	color: #666;
}

#spacer {
	height: 4em;
}
</style>
