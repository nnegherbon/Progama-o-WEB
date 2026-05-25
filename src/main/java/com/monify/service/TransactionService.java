package com.monify.service;

import com.monify.dto.FinancialSummaryDTO;
import com.monify.dto.TransactionDTO;
import com.monify.entity.Category;
import com.monify.entity.Transaction;
import com.monify.entity.User;
import com.monify.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserService userService;
    private final CategoryService categoryService;

    public Transaction createTransaction(Long userId, TransactionDTO transactionDTO) {
        User user = userService.getUserById(userId);
        Category category = categoryService.getCategoryById(transactionDTO.getCategoryId());

        Transaction transaction = Transaction.builder()
                .user(user)
                .category(category)
                .amount(transactionDTO.getAmount())
                .type(transactionDTO.getType())
                .description(transactionDTO.getDescription())
                .date(transactionDTO.getDate())
                .build();

        return transactionRepository.save(transaction);
    }

    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transação não encontrada"));
    }

    public List<TransactionDTO> getTransactionsByUserId(Long userId) {
        userService.getUserById(userId); // Verifica se usuário existe
        return transactionRepository.findByUserIdOrderByDateDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TransactionDTO> getTransactionsByUserIdAndType(Long userId, Transaction.TransactionType type) {
        userService.getUserById(userId);
        return transactionRepository.findByUserIdAndType(userId, type)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TransactionDTO> getTransactionsByUserIdAndCategory(Long userId, Long categoryId) {
        userService.getUserById(userId);
        categoryService.getCategoryById(categoryId);
        return transactionRepository.findByUserIdAndCategoryId(userId, categoryId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TransactionDTO> getTransactionsByUserIdTypeAndCategory(Long userId, Transaction.TransactionType type, Long categoryId) {
        userService.getUserById(userId);
        categoryService.getCategoryById(categoryId);
        return transactionRepository.findByUserIdAndTypeAndCategoryId(userId, type, categoryId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Transaction updateTransaction(Long id, TransactionDTO transactionDTO) {
        Transaction transaction = getTransactionById(id);
        Category category = categoryService.getCategoryById(transactionDTO.getCategoryId());

        transaction.setAmount(transactionDTO.getAmount());
        transaction.setType(transactionDTO.getType());
        transaction.setDescription(transactionDTO.getDescription());
        transaction.setDate(transactionDTO.getDate());
        transaction.setCategory(category);

        return transactionRepository.save(transaction);
    }

    public void deleteTransaction(Long id) {
        transactionRepository.deleteById(id);
    }

    public FinancialSummaryDTO getFinancialSummary(Long userId) {
        userService.getUserById(userId);

        BigDecimal totalIncome = transactionRepository.getTotalIncome(userId);
        BigDecimal totalExpense = transactionRepository.getTotalExpense(userId);
        Long transactionCount = transactionRepository.getTransactionCount(userId);

        totalIncome = (totalIncome != null) ? totalIncome : BigDecimal.ZERO;
        totalExpense = (totalExpense != null) ? totalExpense : BigDecimal.ZERO;

        BigDecimal balance = totalIncome.subtract(totalExpense);

        java.util.Map<String, BigDecimal> expensesByCategory = new java.util.HashMap<>();
        List<Object[]> results = transactionRepository.getExpensesByCategory(userId);
        if (results != null) {
            for (Object[] result : results) {
                if (result != null && result.length >= 2) {
                    expensesByCategory.put((String) result[0], (BigDecimal) result[1]);
                }
            }
        }

        return FinancialSummaryDTO.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .balance(balance)
                .transactionCount(transactionCount != null ? transactionCount : 0L)
                .userId(userId)
                .expensesByCategory(expensesByCategory)
                .build();
    }

    public List<TransactionDTO> getTransactionsByDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        userService.getUserById(userId);
        return transactionRepository.findByUserIdAndDateRange(userId, startDate, endDate)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public TransactionDTO convertToDTO(Transaction transaction) {
        return TransactionDTO.builder()
                .id(transaction.getId())
                .amount(transaction.getAmount())
                .type(transaction.getType())
                .description(transaction.getDescription())
                .date(transaction.getDate())
                .categoryId(transaction.getCategory().getId())
                .categoryName(transaction.getCategory().getName())
                .categoryIcon(transaction.getCategory().getIcon())
                .categoryColor(transaction.getCategory().getColor())
                .userId(transaction.getUser().getId())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .build();
    }
}
