<template>
	<div>
		<div id="list">
			<DepositCard
				v-for="deposit in sortedDeposits"
				:key="deposit.walletId + '-' + deposit.protocolId + '-' + deposit.assetId"
				:amount="deposit.amount"
				:asset-id="deposit.assetId"
				:wallet-id="deposit.walletId"
				:protocol-id="deposit.protocolId"
				:rate="deposit.rate"
				:price="deposit.price"
				@click.native="openDeposit(deposit)"
			/>
		</div>
		<div id="table">
			<Row
				v-for="deposit in sortedDeposits"
				:key="deposit.walletId + '-' + deposit.protocolId + '-' + deposit.assetId"
				:wallet-id="deposit.walletId"
				:amount="deposit.amount"
				:ticker="formatAsset(deposit.assetId)"
				:title="formatProtocol(deposit.protocolId)"
				:rate="deposit.rate"
				:price="deposit.price"
				@click.native="openDeposit(deposit)"
			/>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import DepositCard from '../card/DepositCard.vue';
import Row from '../Row.vue';

import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';
import Storage from '../../utils/storage.js';

export default {
	components: {
		DepositCard,
		Row,
	},
	props: {
		deposits: {
			type: Array,
			default: () => [],
		},
		rates: {
			type: Object,
			default: () => {},
		},
		prices: {
			type: Object,
			default: () => {},
		},
	},
	computed: {
		sortedDeposits() {
			const deposits = [];
			for (const rawDeposit of this.deposits) {
				const { walletId, assetId, protocolId, balance } = rawDeposit;
				const price = this.prices[assetId] || '0';
				const rate = this.rates.supply[protocolId][assetId];
				const amount = Converter.toAmount(balance, assetId);
				const amountNumber = new BigNumber(amount);
				const value = amountNumber.times(price).toString();
				const deposit = {
					walletId,
					amount,
					assetId,
					protocolId,
					price,
					rate,
					value,
				};
				deposits.push(deposit);
			}
			deposits.sort((a, b) => {
				const aValue = new BigNumber(a.value);
				const bValue = new BigNumber(b.value);
				return aValue.lt(bValue)
					? 1
					: aValue.gt(bValue)
						? -1
						: 0;
			});
			const meaningfulDeposits = deposits.filter(deposit => {
				const value = new BigNumber(deposit.value);
				return value.gt(0);
			});
			return meaningfulDeposits;
		},
	},
	methods: {
		openDeposit(deposit) {
			const { walletId, protocolId, assetId } = deposit;
			const walletList = Storage.getWalletList();
			const walletAddress = walletList[walletId].address;
			const path = `/wallet/${walletAddress}/deposit/${protocolId}/${assetId}`;
			this.$router.push(path);
		},
		formatAsset(assetId) {
			return Formatter.formatAsset(assetId);
		},
		formatProtocol(protocolId) {
			return Formatter.formatProtocol(protocolId);
		},
	},
};
</script>

<style scoped>
#list {
	display: flex;
	flex-wrap: wrap;
}

#table {
	display: none;
}

@media (max-width: 767px) {
	#list {
		display: none;
	}

	#table {
		display: initial;
	}
}
</style>
