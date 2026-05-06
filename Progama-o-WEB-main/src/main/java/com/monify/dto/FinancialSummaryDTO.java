package com.monify.dto;

import java.math.BigDecimal;
import java.util.Map;

public class FinancialSummaryDTO {
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;
    private Long transactionCount;
    private Long userId;
    private Map<String, BigDecimal> expensesByCategory;

    public FinancialSummaryDTO() {
    }

    public FinancialSummaryDTO(BigDecimal totalIncome, BigDecimal totalExpense, BigDecimal balance,
                               Long transactionCount, Long userId, Map<String, BigDecimal> expensesByCategory) {
        this.totalIncome = totalIncome;
        this.totalExpense = totalExpense;
        this.balance = balance;
        this.transactionCount = transactionCount;
        this.userId = userId;
        this.expensesByCategory = expensesByCategory;
    }

    public static Builder builder() { return new Builder(); }

    public BigDecimal getTotalIncome() { return totalIncome; }
    public void setTotalIncome(BigDecimal totalIncome) { this.totalIncome = totalIncome; }
    public BigDecimal getTotalExpense() { return totalExpense; }
    public void setTotalExpense(BigDecimal totalExpense) { this.totalExpense = totalExpense; }
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
    public Long getTransactionCount() { return transactionCount; }
    public void setTransactionCount(Long transactionCount) { this.transactionCount = transactionCount; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Map<String, BigDecimal> getExpensesByCategory() { return expensesByCategory; }
    public void setExpensesByCategory(Map<String, BigDecimal> expensesByCategory) { this.expensesByCategory = expensesByCategory; }

    public static class Builder {
        private BigDecimal totalIncome;
        private BigDecimal totalExpense;
        private BigDecimal balance;
        private Long transactionCount;
        private Long userId;
        private Map<String, BigDecimal> expensesByCategory;
        public Builder totalIncome(BigDecimal totalIncome) { this.totalIncome = totalIncome; return this; }
        public Builder totalExpense(BigDecimal totalExpense) { this.totalExpense = totalExpense; return this; }
        public Builder balance(BigDecimal balance) { this.balance = balance; return this; }
        public Builder transactionCount(Long transactionCount) { this.transactionCount = transactionCount; return this; }
        public Builder userId(Long userId) { this.userId = userId; return this; }
        public Builder expensesByCategory(Map<String, BigDecimal> expensesByCategory) { this.expensesByCategory = expensesByCategory; return this; }
        public FinancialSummaryDTO build() { return new FinancialSummaryDTO(totalIncome, totalExpense, balance, transactionCount, userId, expensesByCategory); }
    }
}
