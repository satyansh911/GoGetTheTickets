package com.satyansh.gogetthetickets.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

/** Issues the signed JWT the browser sends back as {@code Authorization: Bearer ...}. */
@Service
public class TokenService {

	private final JwtEncoder encoder;
	private final Clock clock;
	private final Duration lifetime;

	public TokenService(JwtEncoder encoder, Clock clock, @Value("${app.jwt.lifetime}") Duration lifetime) {
		this.encoder = encoder;
		this.clock = clock;
		this.lifetime = lifetime;
	}

	public String issue(User user) {
		Instant now = clock.instant();
		JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer("gogetthetickets")
				.subject(String.valueOf(user.getId()))
				.issuedAt(now)
				.expiresAt(now.plus(lifetime))
				.claim("name", user.getName())
				.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
	}

}
