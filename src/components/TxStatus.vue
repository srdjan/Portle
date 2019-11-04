<template>
	<div id="txStatus" :class="{'shown': status != 'none'}">
		{{ text }}
	</div>
</template>

<script>
export default {
	props: ['status', 'onHidden'],
	data() {
		return {
			lastStatus: '',
			timeoutId: 0,
		}
	},
	watch: {
		status(value) {
			clearTimeout(this.timeoutId);
			if (this.status == 'mining' || this.status == 'pending') {
				return;
			}
			if (this.status != 'none') {
				this.lastStatus = this.status;
			}
			this.timeoutId = setTimeout(this.onHidden, 10 * 1000);
		},
	},
	computed: {
		text() {
			const textMap = {
				'pending': 'Waiting for confirmation…',
				'rejected': 'Transaction rejected.',
				'mining': 'Mining the transaction…',
				'success': 'Transaction complete.',
				'failure': 'Transaction failed.',
			};
			const text = textMap[this.status] || textMap[this.lastStatus];
			return text;
		},
	},
}
</script>

<style scoped>
#txStatus {
	position: absolute;
	bottom: 0px;
	right: 32px;
	font-size: 0.8em;
	border: 1px solid black;
	padding: 0.5em 1.5em;
	opacity: 0;
	transition: bottom 1s ease, opacity 1s ease;
}

#txStatus.shown {
	bottom: 32px;
	opacity: 1;
}
</style>
