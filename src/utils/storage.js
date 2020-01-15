const ACCOUNT_KEY = 'accounts';

class Storage {
	static getWalletList() {
		const listString = localStorage.getItem(ACCOUNT_KEY) || '[]';
		const list = JSON.parse(listString);
		return list;
	}

	static addWallet(wallet) {
		this.removeWallet(wallet);
		const walletList = this.getWalletList();
		walletList.push(wallet);
		_saveWalletList(walletList);
	}

	static removeWallet(wallet) {
		const walletList = this.getWalletList();
		const walletIndex = walletList.findIndex(w => w.address == wallet.address);
		if (walletIndex == -1) {
			return;
		}
		walletList.splice(walletIndex, 1);
		_saveWalletList(walletList);
	}
}

function _saveWalletList(walletList) {
	const listString = JSON.stringify(walletList);
	localStorage.setItem(ACCOUNT_KEY, listString);
}

export default Storage;
