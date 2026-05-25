package com.monify;

import com.monify.dto.FinancialSummaryDTO;
import com.monify.dto.TransactionDTO;
import com.monify.entity.Category;
import com.monify.entity.Transaction;
import com.monify.entity.User;
import com.monify.repository.CategoryRepository;
import com.monify.repository.TransactionRepository;
import com.monify.repository.UserRepository;
import com.monify.service.CategoryService;
import com.monify.service.TransactionService;
import com.monify.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class TransactionServiceTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private UserService userService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private User testUser;
    private Category testCategory;

    @BeforeEach
    public void setUp() {
        transactionRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();

        testUser = User.builder()
                .email("test@example.com")
                .password("password123")
                .name("Test User")
                .build();
        testUser = userRepository.save(testUser);

        testCategory = Category.builder()
                .name("Alimentação")
                .icon("🍔")
                .color("#FF6B6B")
                .build();
        testCategory = categoryRepository.save(testCategory);
    }

    @Test
    public void testCreateTransaction() {
        TransactionDTO transactionDTO = TransactionDTO.builder()
                .amount(new BigDecimal("150.50"))
                .type(Transaction.TransactionType.EXPENSE)
                .description("Compra no mercado")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .build();

        Transaction transaction = transactionService.createTransaction(testUser.getId(), transactionDTO);

        assertNotNull(transaction.getId());
        assertEquals(new BigDecimal("150.50"), transaction.getAmount());
        assertEquals(Transaction.TransactionType.EXPENSE, transaction.getType());
    }

    @Test
    public void testGetTransactionsByUserId() {
        TransactionDTO transactionDTO = TransactionDTO.builder()
                .amount(new BigDecimal("100.00"))
                .type(Transaction.TransactionType.EXPENSE)
                .description("Teste")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .build();

        transactionService.createTransaction(testUser.getId(), transactionDTO);

        List<TransactionDTO> transactions = transactionService.getTransactionsByUserId(testUser.getId());

        assertFalse(transactions.isEmpty());
        assertEquals(1, transactions.size());
    }

    @Test
    public void testGetFinancialSummary() {
        // Criar receita
        TransactionDTO incomeDTO = TransactionDTO.builder()
                .amount(new BigDecimal("1000.00"))
                .type(Transaction.TransactionType.INCOME)
                .description("Salário")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .build();

        // Criar despesa
        TransactionDTO expenseDTO = TransactionDTO.builder()
                .amount(new BigDecimal("150.50"))
                .type(Transaction.TransactionType.EXPENSE)
                .description("Compra no mercado")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .build();

        transactionService.createTransaction(testUser.getId(), incomeDTO);
        transactionService.createTransaction(testUser.getId(), expenseDTO);

        FinancialSummaryDTO summary = transactionService.getFinancialSummary(testUser.getId());

        assertEquals(new BigDecimal("1000.00"), summary.getTotalIncome());
        assertEquals(new BigDecimal("150.50"), summary.getTotalExpense());
        assertEquals(new BigDecimal("849.50"), summary.getBalance());
        assertEquals(2L, summary.getTransactionCount());
        assertNotNull(summary.getExpensesByCategory());
        assertEquals(1, summary.getExpensesByCategory().size());
    }

    @Test
    public void testGetTransactionsByType() {
        // Criar receita
        TransactionDTO incomeDTO = TransactionDTO.builder()
                .amount(new BigDecimal("1000.00"))
                .type(Transaction.TransactionType.INCOME)
                .description("Salário")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .build();

        // Criar despesa
        TransactionDTO expenseDTO = TransactionDTO.builder()
                .amount(new BigDecimal("150.50"))
                .type(Transaction.TransactionType.EXPENSE)
                .description("Compra")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .build();

        transactionService.createTransaction(testUser.getId(), incomeDTO);
        transactionService.createTransaction(testUser.getId(), expenseDTO);

        List<TransactionDTO> expenses = transactionService.getTransactionsByUserIdAndType(testUser.getId(), Transaction.TransactionType.EXPENSE);

        assertEquals(1, expenses.size());
        assertEquals(Transaction.TransactionType.EXPENSE, expenses.get(0).getType());
    }

    @Test
    public void testUpdateTransaction() {
        TransactionDTO transactionDTO = TransactionDTO.builder()
                .amount(new BigDecimal("100.00"))
                .type(Transaction.TransactionType.EXPENSE)
                .description("Teste")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .build();

        Transaction transaction = transactionService.createTransaction(testUser.getId(), transactionDTO);

        TransactionDTO updateDTO = TransactionDTO.builder()
                .amount(new BigDecimal("200.00"))
                .type(Transaction.TransactionType.EXPENSE)
                .description("Teste atualizado")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .build();

        Transaction updated = transactionService.updateTransaction(transaction.getId(), updateDTO);

        assertEquals(new BigDecimal("200.00"), updated.getAmount());
        assertEquals("Teste atualizado", updated.getDescription());
    }

    @Test
    public void testDeleteTransaction() {
        TransactionDTO transactionDTO = TransactionDTO.builder()
                .amount(new BigDecimal("100.00"))
                .type(Transaction.TransactionType.EXPENSE)
                .description("Teste")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .build();

        Transaction transaction = transactionService.createTransaction(testUser.getId(), transactionDTO);
        Long transactionId = transaction.getId();

        transactionService.deleteTransaction(transactionId);

        assertThrows(RuntimeException.class, () -> transactionService.getTransactionById(transactionId));
    }
}
