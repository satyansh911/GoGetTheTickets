package com.satyansh.gogetthetickets.booking;

import java.util.Locale;

import org.springframework.stereotype.Component;

/**
 * No money moves. Declines when the client asks for a failure, or when the UPI ID contains
 * "fail", so the failure path can be demoed.
 */
@Component
public class DemoPaymentGateway implements PaymentGateway {

	@Override
	public Result charge(Charge charge) {
		boolean upiFail = charge.upiId() != null && charge.upiId().toLowerCase(Locale.ROOT).contains("fail");
		return charge.forceFailure() || upiFail ? Result.declined("DEMO_DECLINED") : Result.ok();
	}

}
