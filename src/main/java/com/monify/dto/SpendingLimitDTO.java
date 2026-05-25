package com.monify.dto;

import com.monify.entity.SpendingLimit;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpendingLimitDTO {

    private Long id;

    @NotBlank(message = "Categoria e obrigatoria")
    private String categoryKey;

    @NotBlank(message = "Nome da categoria e obrigatorio")
    private String categoryName;

    @NotBlank(message = "Mes de referencia e obrigatorio")
    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Mes deve estar no formato yyyy-MM")
    private String month;

    @NotNull(message = "Valor limite e obrigatorio")
    private BigDecimal amount;

    private SpendingLimit.LimitType limitType;

    private BigDecimal spent;
    private BigDecimal percentage;
}
