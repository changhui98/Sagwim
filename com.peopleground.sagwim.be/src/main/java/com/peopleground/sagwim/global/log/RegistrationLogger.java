package com.peopleground.sagwim.global.log;

import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class RegistrationLogger {

    private static final Logger registrationLogger = LoggerFactory.getLogger("sagwim.registration");

    public void log(String username, String email, String provider) {
        String json = String.format(
            "{\"timestamp\":\"%s\",\"username\":\"%s\",\"email\":\"%s\",\"provider\":\"%s\"}",
            Instant.now(),
            escape(username),
            escape(email),
            escape(provider)
        );
        registrationLogger.info(json);
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
