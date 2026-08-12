package com.satyansh.gogetthetickets;

import java.time.Clock;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GoGetTheTicketsApplication {

	public static void main(String[] args) {
		SpringApplication.run(GoGetTheTicketsApplication.class, args);
	}

	// Injected wherever "now" is needed, so tests can substitute a fixed clock.
	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}

}
