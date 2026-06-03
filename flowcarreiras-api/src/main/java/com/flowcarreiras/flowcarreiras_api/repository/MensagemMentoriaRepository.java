package com.flowcarreiras.flowcarreiras_api.repository;

import com.flowcarreiras.flowcarreiras_api.model.MensagemMentoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MensagemMentoriaRepository extends JpaRepository<MensagemMentoria, UUID> {

    List<MensagemMentoria> findByMentoriaIdOrderByDataEnvioAsc(UUID mentoriaId);
}
