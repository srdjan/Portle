export const loadAccount = {
	data() {
		return {
			account: {},
		};
	},
	mounted() {
		this._loadAccount();
	},
	methods: {
		async _loadAccount() {
			const address = localStorage.getItem('address');
			const auth = localStorage.getItem('auth') == 'true';
			this.account = {
				address,
				auth,
			};
		},
	},
};
