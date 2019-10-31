import Vue from 'vue';
import VueRouter from 'vue-router';

import App from './App.vue';

import Login from './pages/Login.vue';
import Portfolio from './pages/Portfolio.vue';

import Asset from './pages/view/Asset.vue';
import Deposit from './pages/view/Deposit.vue';

Vue.use(VueRouter);

const routes = [
	{ path: '/login', component: Login },
	{ path: '/', component: Portfolio },

	{ path: '/asset/:id', component: Asset },
	{ path: '/deposit/:platform/:id', component: Deposit },
];

const router = new VueRouter({
	mode: 'history',
	routes,
});

const app = new Vue({
	router,
	render: h => h(App),
	el: '#app'
});
