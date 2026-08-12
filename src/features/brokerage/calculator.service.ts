import { BrokerConfig } from "./brokerage.schemas";

export interface CalculatorInputs {
	buyPrice: number;
	sellPrice: number;
	quantity: number;
	segment: "delivery" | "intraday" | "futures" | "options" | "commodity" | "currency" | "mtf";
	exchange: "NSE" | "BSE" | "MCX";
}

export interface CalculatorResult {
	turnover: number;
	brokerage: number;
	stt: number;
	exchangeTxnCharge: number;
	sebiCharges: number;
	stampDuty: number;
	dpChargeTotal: number;
	ipftCharge: number;
	gst: number;
	totalTaxesAndCharges: number;
	netPnL: number;
	breakevenPoint: number;
	grossPnL: number;
}

export function calculateBrokerage(
	inputs: CalculatorInputs,
	config: BrokerConfig,
): CalculatorResult {
	const { buyPrice, sellPrice, quantity, segment, exchange } = inputs;
	const buyValue = buyPrice * quantity;
	const sellValue = sellPrice * quantity;
	const turnover = buyValue + sellValue;
	const grossPnL = sellValue - buyValue;

	// 1. Brokerage
	let brokerageAmt = 0;
	let rule;
	if (segment === "delivery") rule = config.equityDelivery;
	else if (segment === "intraday") rule = config.equityIntraday;
	else if (segment === "futures") rule = config.futures;
	else if (segment === "options") rule = config.options;
	else if (segment === "commodity") rule = config.commodity ?? { percentage: 0, maxFlat: 0 };
	else if (segment === "currency") rule = config.currency ?? { percentage: 0, maxFlat: 0 };
	else rule = config.mtf ?? config.equityDelivery;

	const buyBrokerage = rule.maxFlat && rule.maxFlat > 0
		? Math.min(buyValue * rule.percentage, rule.maxFlat)
		: buyValue * rule.percentage;
	const sellBrokerage = rule.maxFlat && rule.maxFlat > 0
		? Math.min(sellValue * rule.percentage, rule.maxFlat)
		: sellValue * rule.percentage;
	brokerageAmt = buyBrokerage + sellBrokerage;

	// 2. STT (Securities Transaction Tax)
	let stt = 0;
	if (segment === "delivery" || segment === "mtf")
		stt = Math.round((buyValue + sellValue) * 0.001); // 0.1% on buy & sell
	else if (segment === "intraday")
		stt = Math.round(sellValue * 0.00025); // 0.025% on sell
	else if (segment === "futures")
		stt = Math.round(sellValue * 0.000125); // 0.0125% on sell
	else if (segment === "options") stt = Math.round(sellValue * 0.000625); // 0.0625% on sell (on premium)
	else if (segment === "commodity") stt = Math.round(sellValue * 0.0001); // CTT 0.01% on sell
	// Currency usually has no STT/CTT

	// 3. Exchange Transaction Charge (Approximate currently for NSE/BSE)
	let exchangeTxnRate = 0;
	if (segment === "delivery" || segment === "intraday" || segment === "mtf") {
		exchangeTxnRate = exchange === "NSE" ? 0.0000297 : 0.0000375; // NSE recently revised
	} else if (segment === "futures") {
		exchangeTxnRate = 0.0000173;
	} else if (segment === "options") {
		exchangeTxnRate = 0.0003503; // on premium
	} else if (segment === "commodity") {
		exchangeTxnRate = 0.000021; // approx MCX
	} else if (segment === "currency") {
		exchangeTxnRate = 0.000009; // approx NSE currency
	}
	const exchangeTxnCharge = turnover * exchangeTxnRate;

	// 4. SEBI Charges & IPFT Charges
	const sebiCharges = turnover * 0.000001; // ₹10 per crore

	let ipftCharge = 0;
	if (exchange === "NSE" && (segment === "delivery" || segment === "intraday" || segment === "mtf" || segment === "futures" || segment === "options")) {
		ipftCharge = turnover * 0.0000001; // ₹10 per crore is SEBI, IPFT is ₹10 per crore approx, effectively 0.0000001 (or wait, usually it's ₹10 per crore = 0.000001)
		// Wait, IPFT is ₹10 per crore for NSE equity.
		ipftCharge = turnover * 0.000001;
	}

	// 5. Stamp Duty (Only on Buy)
	let stampDutyRate = 0;
	if (segment === "delivery" || segment === "mtf") stampDutyRate = 0.00015;
	else if (segment === "intraday") stampDutyRate = 0.00003;
	else if (segment === "futures") stampDutyRate = 0.00002;
	else if (segment === "options") stampDutyRate = 0.00003;
	else if (segment === "commodity") stampDutyRate = 0.00002;
	else if (segment === "currency") stampDutyRate = 0.00001;
	const stampDuty = buyValue * stampDutyRate;

	// 6. DP Charge (Only on Delivery / MTF Sell)
	let dpChargeTotal = 0;
	if ((segment === "delivery" || segment === "mtf") && quantity > 0 && sellValue > 0) {
		const dpConfig = config.dpChargeConfig ?? { brokerFee: 13.5, depositoryFee: 0, isPerISIN: true, gstIncluded: false };
		const baseDp = dpConfig.brokerFee + dpConfig.depositoryFee;
		// If it's per ISIN, we assume 1 ISIN per transaction for the calculator
		dpChargeTotal = dpConfig.isPerISIN ? baseDp : baseDp * quantity;
		// If GST is included, we back it out of the total so we don't double count it in the GST line
		if (dpConfig.gstIncluded) {
			dpChargeTotal = dpChargeTotal / 1.18;
		}
	}

	// 7. GST (18% on Brokerage + SEBI + Exchange + IPFT + DP Charge)
	const gst =
		(brokerageAmt + sebiCharges + exchangeTxnCharge + ipftCharge + dpChargeTotal) * 0.18;

	const totalTaxesAndCharges =
		brokerageAmt +
		stt +
		exchangeTxnCharge +
		sebiCharges +
		ipftCharge +
		stampDuty +
		dpChargeTotal +
		gst;
	const netPnL = grossPnL - totalTaxesAndCharges;
	const breakevenPoint = quantity > 0 ? totalTaxesAndCharges / quantity : 0;

	return {
		turnover,
		grossPnL,
		brokerage: brokerageAmt,
		stt,
		exchangeTxnCharge,
		sebiCharges,
		stampDuty,
		dpChargeTotal,
		ipftCharge,
		gst,
		totalTaxesAndCharges,
		netPnL,
		breakevenPoint,
	};
}
