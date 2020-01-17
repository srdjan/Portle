import BigNumber from 'bignumber.js';

import Converter from './converter.js';

class Balance {
	static getTotal(assets, deposits, investments, components, prices) {
		const assetValue = this.getAssets(assets, prices);
		const depositValue = this.getDeposits(deposits, prices);
		const investmentValue = this.getInvestments(investments, components, prices);
		const value = assetValue.plus(depositValue).plus(investmentValue);
		return value;
	}

	static getAssets(assets, prices) {
		let assetValue = new BigNumber(0);
		for (const asset of assets) {
			const { id, balance } = asset;
			const price = prices[id];
			if (!price) {
				continue;
			}
			const amount = Converter.toAmount(balance, id);
			const amountNumber = new BigNumber(amount);
			const value = amountNumber.times(price);
			assetValue = assetValue.plus(value);
		}
		return assetValue;
	}

	static getDeposits(deposits, prices) {
		let depositValue = new BigNumber(0);
		for (const deposit of deposits) {
			const { assetId, balance } = deposit;
			const price = prices[assetId];
			if (!price) {
				continue;
			}
			const amount = Converter.toAmount(balance, assetId);
			const amountNumber = new BigNumber(amount);
			const value = amountNumber.times(price);
			depositValue = depositValue.plus(value);
		}
		return depositValue;
	}

	static getInvestments(investments, components, prices) {
		let investmentValue = new BigNumber(0);
		for (const investment of investments) {
			const { platformId, id, balance} = investment;
			const investmentComponents = components[platformId][id];
			let price = new BigNumber(0);
			for (const component of investmentComponents) {
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
		return investmentValue;
	}
}

export default Balance;
