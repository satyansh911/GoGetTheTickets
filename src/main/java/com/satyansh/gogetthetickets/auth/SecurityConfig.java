package com.satyansh.gogetthetickets.auth;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

/**
 * Stateless API security: no sessions or cookies, just a signed JWT per request.
 * Browsing movies and showtimes is public; anything touching a booking needs a signed-in user.
 */
@Configuration
public class SecurityConfig {

	@Bean
	SecurityFilterChain api(HttpSecurity http) throws Exception {
		http
				// No cookies are used for auth, so there is no CSRF surface to protect.
				.csrf(AbstractHttpConfigurer::disable)
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/api/bookings/**", "/api/auth/me").authenticated()
						.requestMatchers(HttpMethod.POST, "/api/shows/*/holds").authenticated()
						.anyRequest().permitAll())
				.oauth2ResourceServer(o -> o.jwt(jwt -> {
				}).authenticationEntryPoint(jsonUnauthorized()))
				.exceptionHandling(e -> e.authenticationEntryPoint(jsonUnauthorized()));
		return http.build();
	}

	/** 401 as the same {@code {"error": ...}} JSON every other error uses. */
	private static AuthenticationEntryPoint jsonUnauthorized() {
		return (request, response, ex) -> {
			response.setStatus(HttpStatus.UNAUTHORIZED.value());
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write("{\"error\":\"Please sign in to continue\",\"code\":\"UNAUTHENTICATED\"}");
		};
	}

	@Bean
	SecretKey jwtKey(@Value("${app.jwt.secret}") String secret) {
		byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
		if (bytes.length < 32) {
			throw new IllegalStateException("app.jwt.secret must be at least 32 bytes for HS256");
		}
		return new SecretKeySpec(bytes, "HmacSHA256");
	}

	@Bean
	JwtEncoder jwtEncoder(SecretKey jwtKey) {
		return new NimbusJwtEncoder(new ImmutableSecret<>(jwtKey));
	}

	@Bean
	JwtDecoder jwtDecoder(SecretKey jwtKey) {
		return NimbusJwtDecoder.withSecretKey(jwtKey).macAlgorithm(MacAlgorithm.HS256).build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

}
