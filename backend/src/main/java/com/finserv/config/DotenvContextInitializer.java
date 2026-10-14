package com.finserv.config;

import com.finserv.FinServApplication;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

public class DotenvContextInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(@org.springframework.lang.NonNull ConfigurableApplicationContext applicationContext) {
        FinServApplication.loadDotenvIfPresent();
    }
}
