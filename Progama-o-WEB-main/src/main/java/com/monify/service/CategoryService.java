package com.monify.service;

import com.monify.entity.Category;
import com.monify.repository.CategoryRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Category createCategory(String name, String icon, String color) {
        categoryRepository.findByName(name).ifPresent(existing -> {
            throw new RuntimeException("Categoria ja cadastrada");
        });
        Category category = Category.builder().name(name).icon(icon).color(color).build();
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
        createDefaultIfMissing("Alimentacao", "\uD83C\uDF54", "#FF6B6B");
        createDefaultIfMissing("Transporte", "\uD83D\uDE97", "#4ECDC4");
        createDefaultIfMissing("Saude", "\uD83C\uDFE5", "#45B7D1");
        createDefaultIfMissing("Lazer", "\uD83C\uDFAE", "#FFA07A");
        createDefaultIfMissing("Salario", "\uD83D\uDCB0", "#98D8C8");
        createDefaultIfMissing("Educacao", "\uD83D\uDCD3", "#6C5CE7");
        createDefaultIfMissing("Utilidades", "\uD83D\uDCA1", "#FDCB6E");
        createDefaultIfMissing("Outros", "\uD83D\uDCCC", "#95A5A6");
        createDefaultIfMissing("Moradia", "\uD83C\uDFE0", "#2ECC71");
        createDefaultIfMissing("Compras", "\uD83D\uDECD", "#9B59B6");
        createDefaultIfMissing("Investimentos", "\uD83D\uDCC8", "#F1C40F");
        createDefaultIfMissing("Presentes", "\uD83C\uDF81", "#E74C3C");
    }

    private void createDefaultIfMissing(String name, String icon, String color) {
        if (categoryRepository.findByName(name).isEmpty()) {
            Category category = Category.builder().name(name).icon(icon).color(color).build();
            categoryRepository.save(category);
        }
    }
}
