import Vue from 'vue';
import VueRouter from 'vue-router';

import App from './App.vue';

import Login from './pages/Login.vue';
import Portfolio from './pages/Portfolio.vue';
import NewWallet from './pages/NewWallet.vue';
import Wallet from './pages/Wallet.vue';

import Asset from './pages/view/Asset.vue';
import Deposit from './pages/view/Deposit.vue';
import Investment from './pages/view/Investment.vue';

Vue.use(VueRouter);

const routes = [
	{ path: '/login', component: Login },
	{ path: '/', component: Portfolio },
	{ path: '/wallet/new', component: NewWallet },
	{ path: '/wallet/:wallet', component: Wallet },

	{ path: '/wallet/:wallet/asset/:assetId', component: Asset },
	{ path: '/wallet/:wallet/deposit/:platformId/:assetId', component: Deposit },
	{ path: '/wallet/:wallet/investment/:platformId/:investmentId', component: Investment },
];

const router = new VueRouter({
	mode: 'history',
	routes,
});

new Vue({
	router,
	el: '#app',
	render: h => h(App),
});
