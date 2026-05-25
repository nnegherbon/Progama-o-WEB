package com.monify.service;

import com.monify.dto.AccountDTO;
import com.monify.entity.Account;
import com.monify.entity.User;
import com.monify.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserService userService;

    public List<AccountDTO> getAccountsByUserId(Long userId) {
        userService.getUserById(userId);
        return accountRepository.findByUserIdOrderByNameAsc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public AccountDTO createAccount(Long userId, AccountDTO dto) {
        User user = userService.getUserById(userId);
        accountRepository.findByUserIdAndNameIgnoreCase(userId, dto.getName())
                .ifPresent(account -> {
                    throw new RuntimeException("Conta ja cadastrada");
                });

        Account account = Account.builder()
                .user(user)
                .name(dto.getName().trim())
                .type(dto.getType())
                .balance(dto.getBalance() != null ? dto.getBalance() : BigDecimal.ZERO)
                .build();

        return toDTO(accountRepository.save(account));
    }

    public void deleteAccount(Long userId, Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conta nao encontrada"));
        if (!account.getUser().getId().equals(userId)) {
            throw new RuntimeException("Conta nao pertence ao usuario");
        }
        accountRepository.delete(account);
    }

    private AccountDTO toDTO(Account account) {
        return AccountDTO.builder()
                .id(account.getId())
                .name(account.getName())
                .type(account.getType())
                .balance(account.getBalance())
                .build();
    }
}
