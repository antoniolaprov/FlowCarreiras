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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OportunidadeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String registrarEObterToken() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("nome", "Token User");
        body.put("email", "tok-" + UUID.randomUUID().toString().substring(0, 8) + "@test.com");
        body.put("senha", "senhaForte1");

        String resposta = mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(resposta).get("token").asText();
    }

    @Test
    void listarSemTokenRetornaNaoAutorizado() throws Exception {
        mockMvc.perform(get("/api/oportunidades"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void listarComTokenRetorna200EArray() throws Exception {
        String token = registrarEObterToken();

        mockMvc.perform(get("/api/oportunidades").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
