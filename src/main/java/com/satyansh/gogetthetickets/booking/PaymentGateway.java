package com.satyansh.gogetthetickets.booking;

import java.math.BigDecimal;

/** The payment provider. The app ships with {@link DemoPaymentGateway}; a real one would call Razorpay, Stripe, etc. */
public interface PaymentGateway {

	record Charge(String bookingId, BigDecimal amount, String method, String upiId, boolean forceFailure) {
	}

	record Result(boolean succeeded, String failureCode) {

		public static Result ok() {
			return new Result(true, null);
		}

		public static Result declined(String code) {
			return new Result(false, code);
		}

	}

	Result charge(Charge charge);

}
