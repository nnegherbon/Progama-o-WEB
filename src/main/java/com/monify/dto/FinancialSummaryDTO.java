package com.monify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialSummaryDTO {

    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;
    private Long transactionCount;
    private Long userId;
<<<<<<< HEAD
    private java.util.Map<String, BigDecimal> expensesByCategory;
=======
>>>>>>> 734c5886e2e7b9d518ddc0e41a88a84bef51d50f
}
