import BigNumber from 'bignumber.js';

import Converter from './converter.js';

class Balance {
	static getTotal(assets, deposits, investmentBalances, investmentComponents, prices) {
		const assetValue = this.getAssets(assets, prices);
		const depositValue = this.getDeposits(deposits, prices);
		const investmentValue = this.getInvestments(investmentBalances, investmentComponents, prices);
		const value = assetValue.plus(depositValue).plus(investmentValue);
		return value;
	}

	static getAssets(assets, prices) {
		let assetValue = new BigNumber(0);
		for (const assetId in assets) {
			const price = prices[assetId];
			if (!price) {
				continue;
			}
			const balance = assets[assetId];
			const amount = Converter.toAmount(balance, assetId);
			const amountNumber = new BigNumber(amount);
			const value = amountNumber.times(price);
			assetValue = assetValue.plus(value);
		}
		return assetValue;
	}

	static getDeposits(deposits, prices) {
		let depositValue = new BigNumber(0);
		for (const platformId in deposits) {
			for (const assetId in deposits[platformId]) {
				const price = prices[assetId];
				if (!price) {
					continue;
				}
				const balance = deposits[platformId][assetId];
				const amount = Converter.toAmount(balance, assetId);
				const amountNumber = new BigNumber(amount);
				const value = amountNumber.times(price);
				depositValue = depositValue.plus(value);
			}
		}
		return depositValue;
	}

	static getInvestments(investmentBalances, investmentComponents, prices) {
		let investmentValue = new BigNumber(0);
		for (const platformId in investmentBalances) {
			const platformBalances = investmentBalances[platformId];
			for (const investmentId in investmentBalances[platformId]) {
				const balance = platformBalances[investmentId];
				const components = investmentComponents[platformId][investmentId];
				let price = new BigNumber(0);
				for (const component of components) {
					const amountNumber = new BigNumber(component.amount);
					const assetId = component.assetId;
					const assetPrice = prices[assetId];
					if (!assetPrice) {
						break;
					}
					const componentPrice = amountNumber.times(assetPrice);
					price = price.plus(componentPrice);
				}
				if (price.isZero()) {
					continue;
				}
				const amount = Converter.toAmount(balance, 'eth');
				const amountNumber = new BigNumber(amount);
				const value = amountNumber.times(price).toString();
				investmentValue = investmentValue.plus(value);
			}
		}
		return investmentValue;
	}
}

export default Balance;
