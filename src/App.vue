<template>
	<div
		id="app"
	>
		<header
			v-if="showNavigation()"
		>
			<div
				class="header-part"
				@click="openHomePage()"
			>
				<img
					id="logo"
					:src="logo"
				>
				<h1
					id="title"
				>
					Portle
				</h1>
			</div>
			<div
				class="header-part"
			>
				<div class="tooltip-trigger">
					<span
						id="address"
						@click="copyAddress()"
						@mouseleave="resetTooltip()"
					>
						{{ formatAddress(getAddress()) }}
					</span>
					<span class="tooltip">{{ copyTooltipText }}</span>
				</div>
				<button
					id="logout-button"
					@click="logout()"
				>
					Log out
				</button>
			</div>
		</header>
		<main>
			<aside />
			<section>
				<router-view />
			</section>
			<aside />
		</main>
		<footer />
	</div>
</template>

<script>
import Formatter from './utils/formatter.js';

// eslint-disable-next-line no-unused-vars
import favicon from '../public/favicon.ico';
// eslint-disable-next-line no-unused-vars
import card from '../public/img/card.png';
import logo from '../public/img/logo.svg';

export default {
	data() {
		return {
			copied: false,
		};
	},
	computed: {
		logo() {
			return logo;
		},
		copyTooltipText() {
			return this.copied
				? 'Copied'
				: 'Click to copy';
		},
	},
	methods: {
		showNavigation() {
			const path = this.$route.path;
			if (path == '/login') {
				return false;
			}
			return true;
		},
		openHomePage() {
			this.$router.push('/');
		},
		logout() {
			localStorage.removeItem('address');
			localStorage.removeItem('auth');
			this.$router.push('/login');
		},
		getAddress() {
			const address = localStorage.getItem('address');
			return address;
		},
		formatAddress(address) {
			return Formatter.formatAddress(address);
		},
		copyAddress() {
			const address = localStorage.getItem('address');
			navigator.clipboard.writeText(address);
			this.copied = true;
		},
		resetTooltip() {
			this.copied = false;
		},
	},
};
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Source+Code+Pro|Source+Sans+Pro&display=swap');

body {
	margin: 0;
	color: black;
	font-family: 'Source Sans Pro', -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

header {
	height: 64px;
	padding: 0 16px 0 16px;
	display: flex;
	justify-content: space-between;
	background: white;
	box-shadow: 0 1px 4px -2px rgba(0, 0, 0, 0.75);
}

footer {
	height: 32px;
}

main {
	display: flex;
}

aside {
	flex: 2;
}

section {
	flex: 5;
}

h1#title {
	margin: 0.25em 0;
	font-size: 1.75em;
}

h2 {
	font-size: 1.25em;
	margin: 1.25em 0 0.25em 0;
}

button {
	padding: 0 1rem;
	font-size: 0.75em;
	height: 2rem;
	min-width: 2rem;
	cursor: pointer;
	border: none;
	background: #eedfbd;
	color: #333;
	border-radius: 4px;
}

button.primary {
	background: #efb22d;
	color: white;
	border: none;
}

button.big {
	padding: 0 1.5em;
	font-size: 1em;
	height: 2.5em;
}

button.action {
	margin: 0 0.5em;
}

button:hover {
	background: #dbbb74;
	box-shadow: rgba(0, 0, 0, 0.2) 0 2px 4px;
}

button.primary:hover {
	background: #e6a10d;
}

button:active {
	background: #dbbb74;
}

button.primary:active {
	background: #d79406;
}

button:disabled {
	opacity: 0.5;
	pointer-events: none;
}

input {
	height: 28px;
	border: none;
	font-size: 1em;
	color: #282821;
}

input:focus {
	outline: none;
}

input:disabled {
	background: none;
	color: grey;
}

input.address {
	width: 480px;
	margin-left: 8px;
}

input.amount {
	font-family: 'Source Code Pro', monospace;
	width: 240px;
}

input.invalid {
	color: #c80815;
}

.action-selector {
	padding: 0.25em 0.5em;
	margin: 0.5em 1em 0.5em 0;
	color: grey;
	cursor: pointer;
}

.action-selector:hover {
	color: #282821;
}

.action-selector.selected {
	color: #282821;
	border-bottom: 2px solid #efb22d;
}

.asset-selector {
	width: 60px;
	margin: 0.5em 1em 0.5em 0;
	padding: 0.5em 1em;
	cursor: pointer;
	font-size: 20px;
	color: grey;
	background: white;
	border: 2px solid grey;
}

.asset-selector:hover {
	color: #282821;
	border-color: #282821;
}

.asset-selector.selected {
	color: #282821;
	border-color: #efb22d;
}

.app-selector {
	width: 100px;
	margin: 0.5em 1em 0.5em 0;
	padding: 0.5em 1em;
	cursor: pointer;
	color: grey;
	background: white;
	border: 2px solid grey;
}

.app-selector:hover {
	color: #282821;
	border-color: #282821;
}

.app-selector.selected {
	color: #282821;
	border-color: #efb22d;
}

.hidden {
	opacity: 0;
	cursor: inherit;
}

/* Mobile */

@media all and (max-width: 1399px) {
	aside {
		flex: 1;
	}

	section {
		flex: 3;
	}
}

@media all and (max-width: 1023px) {
	aside {
		flex: 1;
	}

	section {
		flex: 4;
	}

	input.address {
		width: 320px;
	}
}

@media all and (max-width: 767px) {
	aside {
		flex: 1;
	}

	section {
		flex: 8;
	}

	input.amount {
		width: 140px;
	}

	input.address {
		width: 180px;
	}

	.asset-selector {
		margin: 0.5em 0.25em 0.5em 0;
		padding: 0.25em 0.5em;
	}

	.app-selector {
		margin: 0.5em 0.25em 0.5em 0;
		padding: 0.25em 0.25em;
	}
}
</style>

<style scoped>
.header-part {
	display: flex;
	align-items: center;
}

h1#title {
	margin-left: 0.5em;
	cursor: default;
}

#logo {
	height: 32px;
}

#logout-button {
	margin-left: 16px;
}

#address {
	cursor: pointer;
}

.tooltip-trigger .tooltip {
	position: absolute;
	margin-top: 10px;
	margin-left: 10px;
	padding: 4px 8px;
	font-size: 0.75em;
	color: #fff;
	background-color: #555;
	border-radius: 4px;
	visibility: hidden;
	opacity: 0;
	transition: opacity 0.5s;
}

.tooltip-trigger:hover .tooltip {
	visibility: visible;
	opacity: 1;
}

/* Mobile */

@media all and (max-width: 767px) {
	#title {
		display: none;
	}
}
</style>
