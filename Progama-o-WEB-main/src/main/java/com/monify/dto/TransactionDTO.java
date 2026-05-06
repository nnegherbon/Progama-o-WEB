package com.monify.dto;

import com.monify.entity.Transaction;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TransactionDTO {

    private Long id;

    @NotNull(message = "Valor e obrigatorio")
    @Positive(message = "Valor deve ser maior que zero")
    private BigDecimal amount;

    @NotNull(message = "Tipo e obrigatorio")
    private Transaction.TransactionType type;

    @NotBlank(message = "Descricao e obrigatoria")
    private String description;

    @NotNull(message = "Data e obrigatoria")
    private LocalDate date;

    @NotNull(message = "Categoria e obrigatoria")
    private Long categoryId;

    private Long userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String categoryName;
    private String categoryIcon;
    private String categoryColor;

    public TransactionDTO() {
    }

    public TransactionDTO(Long id, BigDecimal amount, Transaction.TransactionType type, String description,
                          LocalDate date, Long categoryId, Long userId, LocalDateTime createdAt,
                          LocalDateTime updatedAt, String categoryName, String categoryIcon, String categoryColor) {
        this.id = id;
        this.amount = amount;
        this.type = type;
        this.description = description;
        this.date = date;
        this.categoryId = categoryId;
        this.userId = userId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.categoryName = categoryName;
        this.categoryIcon = categoryIcon;
        this.categoryColor = categoryColor;
    }

    public static Builder builder() { return new Builder(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Transaction.TransactionType getType() { return type; }
    public void setType(Transaction.TransactionType type) { this.type = type; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public String getCategoryIcon() { return categoryIcon; }
    public void setCategoryIcon(String categoryIcon) { this.categoryIcon = categoryIcon; }
    public String getCategoryColor() { return categoryColor; }
    public void setCategoryColor(String categoryColor) { this.categoryColor = categoryColor; }

    public static class Builder {
        private Long id;
        private BigDecimal amount;
        private Transaction.TransactionType type;
        private String description;
        private LocalDate date;
        private Long categoryId;
        private Long userId;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String categoryName;
        private String categoryIcon;
        private String categoryColor;
        public Builder id(Long id) { this.id = id; return this; }
        public Builder amount(BigDecimal amount) { this.amount = amount; return this; }
        public Builder type(Transaction.TransactionType type) { this.type = type; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder date(LocalDate date) { this.date = date; return this; }
        public Builder categoryId(Long categoryId) { this.categoryId = categoryId; return this; }
        public Builder userId(Long userId) { this.userId = userId; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder categoryName(String categoryName) { this.categoryName = categoryName; return this; }
        public Builder categoryIcon(String categoryIcon) { this.categoryIcon = categoryIcon; return this; }
        public Builder categoryColor(String categoryColor) { this.categoryColor = categoryColor; return this; }
        public TransactionDTO build() { return new TransactionDTO(id, amount, type, description, date, categoryId, userId, createdAt, updatedAt, categoryName, categoryIcon, categoryColor); }
    }
}
