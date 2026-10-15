package com.finserv.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

/**
 * Automatically loads backend/.env or .env into the Spring Environment and JVM System properties
 * before application context startup across all profiles and test runners.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        File dotEnvBackend = new File("backend/.env");
        File dotEnvRoot = new File(".env");
        File targetFile = dotEnvBackend.exists() ? dotEnvBackend : (dotEnvRoot.exists() ? dotEnvRoot : null);

        if (targetFile != null) {
            File absFile = targetFile.getAbsoluteFile();
            Dotenv dotenv = Dotenv.configure()
                    .directory(absFile.getParent())
                    .filename(absFile.getName())
                    .ignoreIfMissing()
                    .load();

            Map<String, Object> envMap = new HashMap<>();
            dotenv.entries().forEach(entry -> {
                envMap.put(entry.getKey(), entry.getValue());
                if (System.getProperty(entry.getKey()) == null && System.getenv(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });

            environment.getPropertySources().addFirst(new MapPropertySource("dotenvProperties", envMap));
        }
    }
}
