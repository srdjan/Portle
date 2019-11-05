<template>
	<transition name="slide">
		<div
			v-if="shown"
			id="txStatus"
		>
			{{ text }}
		</div>
	</transition>
</template>

<script>
export default {
	props: ['status', 'onHidden'],
	data() {
		return {
			lastStatus: '',
			timeoutId: 0,
		};
	},
	watch: {
		status() {
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
		shown() {
			return this.status != 'none';
		},
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
};
</script>

<style scoped>
#txStatus {
	position: absolute;
	bottom: 32px;
	right: 32px;
	font-size: 0.8em;
	border: 1px solid black;
	padding: 0.5em 1.5em;
}

.slide-enter-active, .slide-leave-active {
	transition: all 1s ease;
}

.slide-enter, .slide-leave-to {
	opacity: 0;
	transform: translateY(32px);
}
</style>
