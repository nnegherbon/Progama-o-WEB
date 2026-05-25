package com.monify.service;

import com.monify.dto.SpendingLimitDTO;
import com.monify.entity.SpendingLimit;
import com.monify.entity.Transaction;
import com.monify.entity.User;
import com.monify.repository.SpendingLimitRepository;
import com.monify.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SpendingLimitService {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");

    private final SpendingLimitRepository spendingLimitRepository;
    private final TransactionRepository transactionRepository;
    private final UserService userService;

    public List<SpendingLimitDTO> getLimits(Long userId, String month, SpendingLimit.LimitType type) {
        userService.getUserById(userId);
        List<SpendingLimit> limits;
        if (month != null && !month.isBlank() && type != null) {
            limits = spendingLimitRepository.findByUserIdAndMonthAndLimitTypeOrderByCategoryNameAsc(userId, month, type);
        } else if (month != null && !month.isBlank()) {
            limits = spendingLimitRepository.findByUserIdAndMonthOrderByCategoryNameAsc(userId, month);
        } else {
            limits = spendingLimitRepository.findByUserIdOrderByCategoryNameAsc(userId);
        }

        return limits.stream()
                .map(limit -> toDTO(limit, calculateSpent(userId, limit)))
                .collect(Collectors.toList());
    }

    public SpendingLimitDTO saveLimit(Long userId, SpendingLimitDTO dto) {
        User user = userService.getUserById(userId);
        SpendingLimit.LimitType limitType = dto.getLimitType() != null ? dto.getLimitType() : SpendingLimit.LimitType.EXPENSE;
        SpendingLimit limit = spendingLimitRepository
                .findByUserIdAndCategoryKeyAndMonthAndLimitType(userId, dto.getCategoryKey(), dto.getMonth(), limitType)
                .orElseGet(() -> SpendingLimit.builder()
                        .user(user)
                        .categoryKey(dto.getCategoryKey())
                        .month(dto.getMonth())
                        .limitType(limitType)
                        .build());

        limit.setCategoryName(dto.getCategoryName().trim());
        limit.setAmount(dto.getAmount());
        limit.setLimitType(limitType);

        SpendingLimit saved = spendingLimitRepository.save(limit);
        return toDTO(saved, calculateSpent(userId, saved));
    }

    public void deleteLimit(Long userId, Long id) {
        SpendingLimit limit = spendingLimitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Limite nao encontrado"));
        if (!limit.getUser().getId().equals(userId)) {
            throw new RuntimeException("Limite nao pertence ao usuario");
        }
        spendingLimitRepository.delete(limit);
    }

    private BigDecimal calculateSpent(Long userId, SpendingLimit limit) {
        String[] parts = limit.getMonth().split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        return transactionRepository.findByUserIdAndDateRange(userId, startDate, endDate)
                .stream()
                .filter(transaction -> transaction.getType() == toTransactionType(limit.getLimitType()))
                .filter(transaction -> matchesCategory(transaction, limit))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Transaction.TransactionType toTransactionType(SpendingLimit.LimitType limitType) {
        return limitType == SpendingLimit.LimitType.INCOME
                ? Transaction.TransactionType.INCOME
                : Transaction.TransactionType.EXPENSE;
    }

    private boolean matchesCategory(Transaction transaction, SpendingLimit limit) {
        if (transaction.getCategory() == null || transaction.getCategory().getName() == null) {
            return false;
        }
        String transactionCategory = normalize(transaction.getCategory().getName());
        String limitKey = normalize(limit.getCategoryKey());
        String limitName = normalize(limit.getCategoryName());
        return transactionCategory.contains(limitKey)
                || transactionCategory.contains(limitName)
                || limitKey.contains(transactionCategory)
                || limitName.contains(transactionCategory);
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD);
        return DIACRITICS.matcher(normalized)
                .replaceAll("")
                .toLowerCase()
                .trim();
    }

    private SpendingLimitDTO toDTO(SpendingLimit limit, BigDecimal spent) {
        BigDecimal percentage = BigDecimal.ZERO;
        if (limit.getAmount() != null && limit.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            percentage = spent.multiply(BigDecimal.valueOf(100))
                    .divide(limit.getAmount(), 2, RoundingMode.HALF_UP);
        }

        return SpendingLimitDTO.builder()
                .id(limit.getId())
                .categoryKey(limit.getCategoryKey())
                .categoryName(limit.getCategoryName())
                .month(limit.getMonth())
                .amount(limit.getAmount())
                .limitType(limit.getLimitType() != null ? limit.getLimitType() : SpendingLimit.LimitType.EXPENSE)
                .spent(spent)
                .percentage(percentage)
                .build();
    }
}
