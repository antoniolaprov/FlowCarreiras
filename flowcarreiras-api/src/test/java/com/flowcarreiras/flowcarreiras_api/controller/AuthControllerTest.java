package com.flowcarreiras.flowcarreiras_api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String emailUnico() {
        return "user-" + UUID.randomUUID().toString().substring(0, 8) + "@test.com";
    }

    private String registroBody(String nome, String email, String senha) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("nome", nome);
        body.put("email", email);
        body.put("senha", senha);
        return objectMapper.writeValueAsString(body);
    }

    @Test
    void registroComDadosValidosRetorna201EToken() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registroBody("Ana", emailUnico(), "senhaForte1")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tipo").value("Bearer"));
    }

    @Test
    void registroComEmailInvalidoRetorna400() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registroBody("Ana", "email-invalido", "senhaForte1")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registroComSenhaCurtaRetorna400() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registroBody("Ana", emailUnico(), "1234")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registroComEmailDuplicadoRetorna409() throws Exception {
        String email = emailUnico();
        String body = registroBody("Ana", email, "senhaForte1");

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void loginComCredenciaisValidasRetorna200EToken() throws Exception {
        String email = emailUnico();
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registroBody("Bia", email, "senhaForte1")))
                .andExpect(status().isCreated());

        Map<String, Object> login = new HashMap<>();
        login.put("email", email);
        login.put("senha", "senhaForte1");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value(email));
    }
}
