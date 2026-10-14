package com.finserv;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.io.File;

@SpringBootApplication
@EnableJpaAuditing
public class FinServApplication {

    public static void main(String[] args) {
        loadDotenvIfPresent();
        SpringApplication.run(FinServApplication.class, args);
    }

    /**
     * Loads environment variables from backend/.env or .env if present,
     * without overriding explicitly set system environment variables.
     */
    public static void loadDotenvIfPresent() {
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

            dotenv.entries().forEach(entry -> {
                if (System.getProperty(entry.getKey()) == null && System.getenv(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });
        }
    }
}
