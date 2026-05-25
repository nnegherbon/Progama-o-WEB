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
                .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryByName(String name) {
        return categoryRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
    }

    public void initializeDefaultCategories() {
        if (categoryRepository.count() == 0) {
            createCategory("Alimentação", "🍔", "#FF6B6B");
            createCategory("Transporte", "🚗", "#4ECDC4");
            createCategory("Saúde", "🏥", "#45B7D1");
            createCategory("Lazer", "🎮", "#FFA07A");
            createCategory("Salário", "💰", "#98D8C8");
            createCategory("Educação", "📚", "#6C5CE7");
            createCategory("Utilidades", "💡", "#FDCB6E");
            createCategory("Outros", "📌", "#95A5A6");

            createCategory("Moradia", "🏠", "#2ECC71");
            createCategory("Compras", "🛍️", "#9B59B6");
            createCategory("Investimentos", "📈", "#F1C40F");
            createCategory("Presentes", "🎁", "#E74C3C");
        }
    }
}
