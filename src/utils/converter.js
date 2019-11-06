import BigNumber from 'bignumber.js';

import decimals from '../data/decimals.json';

class Converter {
	static toAmount(amount, assetId) {
		const ten = new BigNumber(10);
		const tickerDecimals = decimals[assetId];
		const multiplier = ten.pow(tickerDecimals);
		const amountNumber = new BigNumber(amount);
		const shortAmountNumber = amountNumber.div(multiplier);
		const shortAmount = shortAmountNumber.toString();
		return shortAmount;
	}

	static toBalance(amount, assetId) {
		const ten = new BigNumber(10);
		const tickerDecimals = decimals[assetId];
		const multiplier = ten.pow(tickerDecimals);
		const amountNumber = new BigNumber(amount);
		const longAmountNumber = amountNumber.times(multiplier);
		const longAmount = longAmountNumber.toFixed(0);
		return longAmount;
	}
};

export default Converter;
