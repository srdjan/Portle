import { ethers } from 'ethers';

export const account = {
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
		async _unlockAccount() {
			const addressList = await window.ethereum.enable();
			const uncheckedAddress = addressList[0];
			const address = ethers.utils.getAddress(uncheckedAddress);
			if (address != this.account.address) {
				this.account.address = address;
				localStorage.setItem('address', address);
			}
			return address;
		},
	},
};
