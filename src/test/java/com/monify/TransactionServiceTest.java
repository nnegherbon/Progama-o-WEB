package com.monify;

import com.monify.dto.FinancialSummaryDTO;
import com.monify.dto.TransactionDTO;
import com.monify.entity.Category;
import com.monify.entity.Account;
import com.monify.entity.CreditCard;
import com.monify.entity.Transaction;
import com.monify.entity.User;
import com.monify.repository.CategoryRepository;
import com.monify.repository.AccountRepository;
import com.monify.repository.CreditCardRepository;
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

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CreditCardRepository creditCardRepository;

    private User testUser;
    private Category testCategory;
    private Account testAccount;

    @BeforeEach
    public void setUp() {
        transactionRepository.deleteAll();
        accountRepository.deleteAll();
        creditCardRepository.deleteAll();
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

        testAccount = accountRepository.save(Account.builder()
                .name("Conta principal")
                .type(Account.AccountType.CHECKING)
                .balance(new BigDecimal("100.00"))
                .user(testUser)
                .build());
    }

    @Test
    public void testCreateTransaction() {
        TransactionDTO transactionDTO = TransactionDTO.builder()
                .amount(new BigDecimal("150.50"))
                .type(Transaction.TransactionType.EXPENSE)
                .description("Compra no mercado")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .periodicity(Transaction.TransactionPeriodicity.SINGLE)
                .status(Transaction.TransactionStatus.COMPLETED)
                .originType(Transaction.MovementOrigin.ACCOUNT)
                .accountId(testAccount.getId())
                .build();

        Transaction transaction = transactionService.createTransaction(testUser.getId(), transactionDTO);

        assertNotNull(transaction.getId());
        assertEquals(new BigDecimal("150.50"), transaction.getAmount());
        assertEquals(Transaction.TransactionType.EXPENSE, transaction.getType());
        assertEquals(new BigDecimal("-50.50"), accountRepository.findById(testAccount.getId()).orElseThrow().getBalance());
    }

    @Test
    public void testGetTransactionsByUserId() {
        TransactionDTO transactionDTO = TransactionDTO.builder()
                .amount(new BigDecimal("100.00"))
                .type(Transaction.TransactionType.EXPENSE)
                .description("Teste")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .periodicity(Transaction.TransactionPeriodicity.SINGLE)
                .status(Transaction.TransactionStatus.COMPLETED)
                .originType(Transaction.MovementOrigin.ACCOUNT)
                .accountId(testAccount.getId())
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
                .periodicity(Transaction.TransactionPeriodicity.SINGLE)
                .status(Transaction.TransactionStatus.COMPLETED)
                .originType(Transaction.MovementOrigin.ACCOUNT)
                .accountId(testAccount.getId())
                .build();

        // Criar despesa
        TransactionDTO expenseDTO = TransactionDTO.builder()
                .amount(new BigDecimal("150.50"))
                .type(Transaction.TransactionType.EXPENSE)
                .description("Compra no mercado")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .periodicity(Transaction.TransactionPeriodicity.SINGLE)
                .status(Transaction.TransactionStatus.COMPLETED)
                .originType(Transaction.MovementOrigin.ACCOUNT)
                .accountId(testAccount.getId())
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
                .periodicity(Transaction.TransactionPeriodicity.SINGLE)
                .status(Transaction.TransactionStatus.COMPLETED)
                .originType(Transaction.MovementOrigin.ACCOUNT)
                .accountId(testAccount.getId())
                .build();

        // Criar despesa
        TransactionDTO expenseDTO = TransactionDTO.builder()
                .amount(new BigDecimal("150.50"))
                .type(Transaction.TransactionType.EXPENSE)
                .description("Compra")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .periodicity(Transaction.TransactionPeriodicity.SINGLE)
                .status(Transaction.TransactionStatus.COMPLETED)
                .originType(Transaction.MovementOrigin.ACCOUNT)
                .accountId(testAccount.getId())
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
                .periodicity(Transaction.TransactionPeriodicity.SINGLE)
                .status(Transaction.TransactionStatus.COMPLETED)
                .originType(Transaction.MovementOrigin.ACCOUNT)
                .accountId(testAccount.getId())
                .build();

        Transaction transaction = transactionService.createTransaction(testUser.getId(), transactionDTO);

        TransactionDTO updateDTO = TransactionDTO.builder()
                .amount(new BigDecimal("200.00"))
                .type(Transaction.TransactionType.EXPENSE)
                .description("Teste atualizado")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .periodicity(Transaction.TransactionPeriodicity.SINGLE)
                .status(Transaction.TransactionStatus.COMPLETED)
                .originType(Transaction.MovementOrigin.ACCOUNT)
                .accountId(testAccount.getId())
                .build();

        Transaction updated = transactionService.updateTransaction(transaction.getId(), updateDTO);

        assertEquals(new BigDecimal("200.00"), updated.getAmount());
        assertEquals("Teste atualizado", updated.getDescription());
        assertEquals(new BigDecimal("-100.00"), accountRepository.findById(testAccount.getId()).orElseThrow().getBalance());
    }

    @Test
    public void testDeleteTransaction() {
        TransactionDTO transactionDTO = TransactionDTO.builder()
                .amount(new BigDecimal("100.00"))
                .type(Transaction.TransactionType.EXPENSE)
                .description("Teste")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .periodicity(Transaction.TransactionPeriodicity.SINGLE)
                .status(Transaction.TransactionStatus.COMPLETED)
                .originType(Transaction.MovementOrigin.ACCOUNT)
                .accountId(testAccount.getId())
                .build();

        Transaction transaction = transactionService.createTransaction(testUser.getId(), transactionDTO);
        Long transactionId = transaction.getId();

        transactionService.deleteTransaction(transactionId);

        assertThrows(RuntimeException.class, () -> transactionService.getTransactionById(transactionId));
        assertEquals(new BigDecimal("100.00"), accountRepository.findById(testAccount.getId()).orElseThrow().getBalance());
    }

    @Test
    void settlingMonthlyIncomeCreditsAccountAndCreatesNextPendingOccurrence() {
        TransactionDTO transactionDTO = TransactionDTO.builder()
                .amount(new BigDecimal("1000.00"))
                .type(Transaction.TransactionType.INCOME)
                .description("Salario mensal")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .periodicity(Transaction.TransactionPeriodicity.MONTHLY)
                .status(Transaction.TransactionStatus.PENDING)
                .originType(Transaction.MovementOrigin.ACCOUNT)
                .accountId(testAccount.getId())
                .build();

        Transaction pending = transactionService.createTransaction(testUser.getId(), transactionDTO);
        assertEquals(new BigDecimal("100.00"), accountRepository.findById(testAccount.getId()).orElseThrow().getBalance());

        Transaction settled = transactionService.settleTransaction(testUser.getId(), pending.getId());
        List<TransactionDTO> transactions = transactionService.getTransactionsByUserId(testUser.getId());

        assertEquals(Transaction.TransactionStatus.COMPLETED, settled.getStatus());
        assertEquals(new BigDecimal("1100.00"), accountRepository.findById(testAccount.getId()).orElseThrow().getBalance());
        assertEquals(2, transactions.size());
        assertTrue(transactions.stream().anyMatch(item ->
                item.getStatus() == Transaction.TransactionStatus.PENDING
                        && item.getDate().equals(LocalDate.now().plusMonths(1))));
        assertThrows(RuntimeException.class,
                () -> transactionService.settleTransaction(testUser.getId(), pending.getId()));
    }

    @Test
    void completedCreditCardExpenseUpdatesUsedLimit() {
        CreditCard card = creditCardRepository.save(CreditCard.builder()
                .name("Cartao teste")
                .brand("Visa")
                .lastFour("1234")
                .limitAmount(new BigDecimal("1000.00"))
                .usedAmount(BigDecimal.ZERO)
                .user(testUser)
                .build());
        TransactionDTO transactionDTO = TransactionDTO.builder()
                .amount(new BigDecimal("250.00"))
                .type(Transaction.TransactionType.EXPENSE)
                .description("Compra no cartao")
                .date(LocalDate.now())
                .categoryId(testCategory.getId())
                .periodicity(Transaction.TransactionPeriodicity.SINGLE)
                .status(Transaction.TransactionStatus.COMPLETED)
                .originType(Transaction.MovementOrigin.CREDIT_CARD)
                .creditCardId(card.getId())
                .build();

        transactionService.createTransaction(testUser.getId(), transactionDTO);

        assertEquals(new BigDecimal("250.00"),
                creditCardRepository.findById(card.getId()).orElseThrow().getUsedAmount());
        assertEquals(new BigDecimal("100.00"),
                accountRepository.findById(testAccount.getId()).orElseThrow().getBalance());
    }
}
