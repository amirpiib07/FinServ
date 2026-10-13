package com.finserv.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("FINServ Core Banking API")
                        .version("1.0.0")
                        .description("RESTful Core Banking Management System API Documentation")
                        .contact(new Contact()
                                .name("FINServ Engineering")
                                .email("engineering@finserv.local"))
                        .license(new License()
                                .name("Proprietary - Enterprise Banking Standard")));
    }
}
