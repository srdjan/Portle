class Wallets {
	static getAssets(wallets) {
		const assets = [];
		if (wallets.length == 0) {
			return assets;
		}
		for (const walletIndex in wallets) {
			const walletId = parseInt(walletIndex);
			const wallet = wallets[walletId];
			for (const id in wallet.assets) {
				const balance = wallet.assets[id];
				if (balance != '0') {
					const asset = {
						walletId,
						id,
						balance,
					};
					assets.push(asset);
				}
			}
		}
		return assets;
	}

	static getDeposits(wallets) {
		const deposits = [];
		if (wallets.length == 0) {
			return deposits;
		}
		for (const walletIndex in wallets) {
			const walletId = parseInt(walletIndex);
			const wallet = wallets[walletId];
			for (const platformId in wallet.deposits) {
				const platformBalance = wallet.deposits[platformId];
				for (const assetId in platformBalance) {
					const balance = platformBalance[assetId];
					if (balance != '0') {
						const deposit = {
							walletId,
							platformId,
							assetId,
							balance,
						};
						deposits.push(deposit);
					}
				}
			}
		}
		return deposits;
	}

	static getInvestments(wallets) {
		const investments = [];
		if (wallets.length == 0) {
			return investments;
		}
		for (const walletIndex in wallets) {
			const walletId = parseInt(walletIndex);
			const wallet = wallets[walletId];
			for (const platformId in wallet.investments) {
				const platformBalance = wallet.investments[platformId];
				for (const investmentId in platformBalance) {
					const balance = platformBalance[investmentId];
					if (balance != '0') {
						const deposit = {
							walletId,
							platformId,
							investmentId,
							balance,
						};
						investments.push(deposit);
					}
				}
			}
		}
		return investments;
	}
}

export default Wallets;
