package com.monify.service;

import com.monify.entity.Category;
import com.monify.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public Category createCategory(String name, String icon, String color) {
        Category category = Category.builder()
                .name(name)
                .icon(icon)
                .color(color)
                .build();
        return categoryRepository.save(category);
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoria nao encontrada"));
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryByName(String name) {
        return categoryRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Categoria nao encontrada"));
    }

    public void initializeDefaultCategories() {
        if (categoryRepository.count() == 0) {
            createCategory("Alimentacao", "\uD83C\uDF54", "#FF6B6B");
            createCategory("Transporte", "\uD83D\uDE97", "#4ECDC4");
            createCategory("Saude", "\uD83C\uDFE5", "#45B7D1");
            createCategory("Lazer", "\uD83C\uDFAE", "#FFA07A");
            createCategory("Salario", "\uD83D\uDCB0", "#98D8C8");
            createCategory("Educacao", "\uD83D\uDCD3", "#6C5CE7");
            createCategory("Utilidades", "\uD83D\uDCA1", "#FDCB6E");
            createCategory("Outros", "\uD83D\uDCCC", "#95A5A6");
            createCategory("Moradia", "\uD83C\uDFE0", "#2ECC71");
            createCategory("Compras", "\uD83D\uDECD", "#9B59B6");
            createCategory("Investimentos", "\uD83D\uDCC8", "#F1C40F");
            createCategory("Presentes", "\uD83C\uDF81", "#E74C3C");
        }
    }
}
