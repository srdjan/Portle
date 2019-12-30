import Vue from 'vue';
import VueRouter from 'vue-router';

import App from './App.vue';

import Login from './pages/Login.vue';
import Portfolio from './pages/Portfolio.vue';

import Asset from './pages/view/Asset.vue';
import Deposit from './pages/view/Deposit.vue';
import Pool from './pages/view/Pool.vue';
import Set from './pages/view/Set.vue';

import ManageDeposit from './pages/manage/Deposit.vue';

Vue.use(VueRouter);

const routes = [
	{ path: '/login', component: Login },
	{ path: '/', component: Portfolio },

	{ path: '/asset/:assetId', component: Asset },
	{ path: '/deposit/:platformId/:assetId', component: Deposit },
	{ path: '/pool/:platformId/:assetId', component: Pool },
	{ path: '/investment/:platformId/:setId', component: Set },

	{ path: '/deposit/manage', component: ManageDeposit },
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
