package com.monify.service;

import com.monify.dto.CreditCardDTO;
import com.monify.entity.CreditCard;
import com.monify.entity.User;
import com.monify.repository.CreditCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CreditCardService {

    private final CreditCardRepository creditCardRepository;
    private final UserService userService;

    public List<CreditCardDTO> getCardsByUserId(Long userId) {
        userService.getUserById(userId);
        return creditCardRepository.findByUserIdOrderByNameAsc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public CreditCardDTO createCard(Long userId, CreditCardDTO dto) {
        User user = userService.getUserById(userId);
        creditCardRepository.findByUserIdAndNameIgnoreCase(userId, dto.getName())
                .ifPresent(card -> {
                    throw new RuntimeException("Cartao ja cadastrado");
                });

        CreditCard card = CreditCard.builder()
                .user(user)
                .name(dto.getName().trim())
                .limitAmount(dto.getLimitAmount() != null ? dto.getLimitAmount() : BigDecimal.ZERO)
                .lastFour(dto.getLastFour())
                .brand(dto.getBrand().trim())
                .build();

        return toDTO(creditCardRepository.save(card));
    }

    public void deleteCard(Long userId, Long id) {
        CreditCard card = creditCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cartao nao encontrado"));
        if (!card.getUser().getId().equals(userId)) {
            throw new RuntimeException("Cartao nao pertence ao usuario");
        }
        creditCardRepository.delete(card);
    }

    private CreditCardDTO toDTO(CreditCard card) {
        return CreditCardDTO.builder()
                .id(card.getId())
                .name(card.getName())
                .limitAmount(card.getLimitAmount())
                .lastFour(card.getLastFour())
                .brand(card.getBrand())
                .build();
    }
}
