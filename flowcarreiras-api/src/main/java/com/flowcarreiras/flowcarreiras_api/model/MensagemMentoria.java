package com.flowcarreiras.flowcarreiras_api.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "mensagens_mentoria",
    indexes = @Index(name = "idx_msg_mentoria_data", columnList = "mentoria_id,data_envio")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MensagemMentoria {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mentoria_id", nullable = false)
    private Mentoria mentoria;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "remetente_id", nullable = false)
    private PerfilArtista remetente;

    @Column(nullable = false, length = 2000)
    private String conteudo;

    @Column(nullable = false)
    private LocalDateTime dataEnvio;

    @PrePersist
    private void prePersist() {
        if (dataEnvio == null) dataEnvio = LocalDateTime.now();
    }
}
