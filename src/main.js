import Vue from 'vue';
import VueRouter from 'vue-router';

import App from './App.vue';

import Login from './pages/Login.vue';
import Main from './pages/Main.vue';

Vue.use(VueRouter);

const routes = [
	{ path: '/login', component: Login },
	{ path: '/', component: Main }
];

const router = new VueRouter({
	mode: 'history',
	routes
});

const app = new Vue({
	router,
	render: h => h(App),
	el: '#app'
});
