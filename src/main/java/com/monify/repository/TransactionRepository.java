package com.monify.repository;

import com.monify.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserId(Long userId);

    List<Transaction> findByUserIdAndType(Long userId, Transaction.TransactionType type);

    List<Transaction> findByUserIdAndCategoryId(Long userId, Long categoryId);

    List<Transaction> findByUserIdAndTypeAndCategoryId(Long userId, Transaction.TransactionType type, Long categoryId);

    List<Transaction> findByUserIdOrderByDateDesc(Long userId);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId AND t.type = 'INCOME'")
    BigDecimal getTotalIncome(@Param("userId") Long userId);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId AND t.type = 'EXPENSE'")
    BigDecimal getTotalExpense(@Param("userId") Long userId);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.user.id = :userId")
    Long getTransactionCount(@Param("userId") Long userId);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId AND t.date BETWEEN :startDate AND :endDate ORDER BY t.date DESC")
    List<Transaction> findByUserIdAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
