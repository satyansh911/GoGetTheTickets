package com.satyansh.gogetthetickets;

import org.springframework.boot.SpringApplication;

public class TestGoGetTheTicketsApplication {

	public static void main(String[] args) {
		SpringApplication.from(GoGetTheTicketsApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
