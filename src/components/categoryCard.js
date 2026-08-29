// ============================================================
// CircuitKart — Category Card Component
// ============================================================

export function CategoryCard(category) {
  return `
    <div class="category-card" onclick="location.hash='/projects?category=${category.id}'">
      <div class="cat-icon">
        <i data-lucide="${category.icon}"></i>
      </div>
      <h3 class="cat-name">${category.name}</h3>
      <div class="cat-count">${category.count} Projects</div>
    </div>
  `;
}
