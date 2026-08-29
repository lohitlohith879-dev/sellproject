// ============================================================
// CircuitKart — Project Card Component
// ============================================================

export function ProjectCard(project) {
  // Generate random tags if not provided (for demo)
  const displayTags = project.tags && project.tags.length > 0 
    ? project.tags.slice(0, 3) 
    : [project.category, project.controller, 'IoT'].slice(0, 3);
    
  const tagsHtml = displayTags.map(tag => `<span class="tag">${tag}</span>`).join('');
  
  // Format price
  const formattedPrice = new Intl.NumberFormat('en-IN').format(project.price);
  
  // Determine badge color based on difficulty
  let diffColor = 'blue';
  if (project.difficulty === 'Beginner') diffColor = 'green';
  if (project.difficulty === 'Intermediate') diffColor = 'orange';
  if (project.difficulty === 'Advanced') diffColor = 'red';

  return `
    <div class="project-card hover-lift">
      <div class="card-image">
        <!-- Placeholder colored background until images are added -->
        <div style="width: 100%; height: 100%; background-color: ${project.imageColor || '#0f3460'}; display: flex; align-items: center; justify-content: center; position: absolute;">
          <span style="opacity: 0.1; font-size: 80px;">⚡</span>
        </div>
        ${project.image ? `<img src="${project.image}" alt="${project.name}" loading="lazy" />` : ''}
        
        <div class="card-badge">
          <span class="badge badge-${diffColor}">${project.difficulty}</span>
        </div>
        
        <div class="card-actions-overlay">
          <button class="save-btn" onclick="appEvents.saveProject('${project.id}')" title="Save for later">
            <i data-lucide="heart"></i>
          </button>
          <button class="quick-view-btn" onclick="location.hash='/project/${project.slug}'" title="Quick View">
            <i data-lucide="eye"></i>
          </button>
        </div>
      </div>
      
      <div class="card-body">
        <h3 class="card-title">${project.name}</h3>
        <p class="card-desc">${project.shortDescription || project.description}</p>
        
        <div class="card-meta">
          <div class="stars">
            ${'<i data-lucide="star" fill="currentColor"></i>'.repeat(Math.floor(project.rating))}
            ${project.rating % 1 > 0 ? '<i data-lucide="star-half"></i>' : ''}
          </div>
          <span>(${project.reviewCount})</span>
        </div>
        
        <div class="card-tags">
          ${tagsHtml}
        </div>
        
        <div class="card-price-row">
          <div class="card-price">₹${formattedPrice} <span>onwards</span></div>
        </div>
        
        <div class="card-buttons">
          <a href="#/project/${project.slug}" class="btn btn-primary">Details</a>
          <a href="#/customizer?base=${project.id}" class="btn btn-secondary">Customize</a>
        </div>
      </div>
    </div>
  `;
}
