import { ProjectCard } from '../components/projectCard.js';
import { store } from '../store.js';

export function ProjectsPage(container, params = {}) {
  const projects = store.get('projects');
  
  // Derive categories dynamically
  const categoryNames = [...new Set(projects.map(p => p.category).filter(Boolean))];
  const categories = categoryNames.map(name => ({
    id: name,
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
    count: projects.filter(p => p.category === name).length
  }));

  // Extract query parameters
  const activeCategory = params.category || 'all';
  const searchQuery = params.q || '';
  
  // Filter logic
  let filteredProjects = [...projects];
  
  if (activeCategory !== 'all') {
    filteredProjects = filteredProjects.filter(p => p.category === activeCategory);
  }
  
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredProjects = filteredProjects.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  }
  
  // Add state to track current sort and filters
  // (In a real app, this would be a bit more robust with DOM events)
  window.currentFilterState = {
    category: activeCategory,
    query: searchQuery,
    sort: 'popular'
  };

  container.innerHTML = `
    <div class="projects-page container section">
      <div class="projects-header reveal">
        <h1 class="heading-xl" style="margin-bottom: var(--space-sm);">All Projects</h1>
        <p class="text-secondary" style="max-width: 600px;">
          Browse our complete catalog of ${projects.length} Embedded Systems and IoT projects. 
          Use the filters to find exactly what you're looking for.
        </p>
      </div>

      <div class="projects-layout">
        <!-- Sidebar Filters -->
        <aside class="filter-panel reveal delay-1">
          <div class="filter-section">
            <h3>Categories</h3>
            <div class="filter-option ${activeCategory === 'all' ? 'active' : ''}" 
                 onclick="location.hash='/projects'">
              All Projects
            </div>
            ${categories.map(cat => `
              <div class="filter-option ${activeCategory === cat.id ? 'active' : ''}" 
                   onclick="location.hash='/projects?category=${cat.id}'">
                ${cat.name} 
                <span class="text-tertiary" style="margin-left:auto; font-size:10px;">${cat.count}</span>
              </div>
            `).join('')}
          </div>

          <div class="filter-section">
            <h3>Difficulty</h3>
            <div class="filter-option"><input type="checkbox" class="form-checkbox"> Beginner</div>
            <div class="filter-option"><input type="checkbox" class="form-checkbox"> Intermediate</div>
            <div class="filter-option"><input type="checkbox" class="form-checkbox"> Advanced</div>
          </div>
          
          <div class="filter-section">
            <h3>Controller</h3>
            <div class="filter-option"><input type="checkbox" class="form-checkbox"> Arduino</div>
            <div class="filter-option"><input type="checkbox" class="form-checkbox"> ESP32</div>
            <div class="filter-option"><input type="checkbox" class="form-checkbox"> ESP8266</div>
            <div class="filter-option"><input type="checkbox" class="form-checkbox"> Raspberry Pi</div>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="projects-content">
          <div class="projects-toolbar reveal delay-2">
            <div class="results-count">
              Showing <strong>${filteredProjects.length}</strong> projects
              ${searchQuery ? `for "<strong>${searchQuery}</strong>"` : ''}
            </div>
            <div class="flex-center gap-sm">
              <span class="text-sm text-secondary">Sort by:</span>
              <select class="sort-select" onchange="console.log('Sort changed')">
                <option value="popular">Popularity</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
          
          <div class="projects-grid reveal delay-3">
            ${filteredProjects.length > 0 
              ? filteredProjects.map(p => ProjectCard(p)).join('')
              : `
                <div style="grid-column: 1/-1; text-align: center; padding: var(--space-4xl) 0;">
                  <i data-lucide="search" style="font-size: 48px; color: var(--text-tertiary); margin-bottom: var(--space-md); opacity: 0.5;"></i>
                  <h3 class="heading-md" style="margin-bottom: var(--space-sm);">No projects found</h3>
                  <p class="text-secondary" style="margin-bottom: var(--space-xl);">Try adjusting your search or filters.</p>
                  <a href="#/projects" class="btn btn-secondary">Clear Filters</a>
                </div>
              `
            }
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}
