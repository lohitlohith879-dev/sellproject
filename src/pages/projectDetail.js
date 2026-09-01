import { store } from '../store.js';

export function ProjectDetailPage(container, params) {
  const projects = store.get('projects');
  const project = projects.find(p => p.slug === params.slug);
  
  if (!project) {
    container.innerHTML = `
      <div class="container section text-center" style="padding-top: calc(var(--nav-height) + var(--space-4xl));">
        <h1 class="heading-xl">Project Not Found</h1>
        <p class="text-secondary" style="margin: var(--space-md) 0 var(--space-xl);">We couldn't find the project you're looking for.</p>
        <a href="#/projects" class="btn btn-primary">Browse Projects</a>
      </div>
    `;
    return;
  }

  const formattedPrice = new Intl.NumberFormat('en-IN').format(project.price);
  
  // Expose function for inline onclick handler
  window.addToCartAndNavigate = () => {
    store.addToCart(project);
    window.location.hash = '/cart';
  };

  container.innerHTML = `
    <div class="project-detail container">
      <!-- Breadcrumbs -->
      <div class="text-sm text-tertiary reveal" style="margin-bottom: var(--space-lg);">
        <a href="#/" class="hover-text">Home</a> &gt; 
        <a href="#/projects" class="hover-text">Projects</a> &gt; 
        <a href="#/projects?category=${project.category}" class="hover-text" style="text-transform: capitalize;">${project.category}</a> &gt; 
        <span class="text-primary">${project.name}</span>
      </div>

      <div class="detail-layout">
        <!-- Left: Image & Info -->
        <div class="detail-main reveal delay-1">
          <div class="detail-gallery">
            <div style="width: 100%; aspect-ratio: 16/9; background-color: ${project.imageColor || '#0f3460'}; display: flex; align-items: center; justify-content: center; position: relative;">
               <span style="opacity: 0.1; font-size: 120px;">⚡</span>
               ${project.image ? `<img src="${project.image}" alt="${project.name}" class="main-image" style="position:absolute; width:100%; height:100%; object-fit:cover;" />` : ''}
            </div>
            <!-- Thumbnails placeholder -->
            <div class="gallery-thumbs" style="background: var(--bg-card); border-top: 1px solid var(--border-subtle);">
              <div class="thumb active" style="background-color: ${project.imageColor || '#0f3460'};"></div>
              <div class="thumb" style="background-color: #1a1a2e;"></div>
              <div class="thumb" style="background-color: #16213e;"></div>
            </div>
          </div>

          <div class="detail-info">
            <h1 class="heading-xl" style="margin-bottom: var(--space-xs);">${project.name}</h1>
            <p class="text-lg text-secondary" style="margin-bottom: var(--space-md);">${project.shortDescription || project.description}</p>
            
            <div class="flex gap-md" style="margin-bottom: var(--space-2xl);">
              <div class="stars" style="font-size: 18px;">
                ${'<i data-lucide="star" fill="currentColor"></i>'.repeat(Math.floor(project.rating))}
                ${project.rating % 1 > 0 ? '<i data-lucide="star-half" fill="currentColor"></i>' : ''}
              </div>
              <span class="text-secondary">${project.rating} (${project.reviewCount} reviews)</span>
              <span class="text-tertiary">|</span>
              <span class="text-secondary"><i data-lucide="box" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i> ${project.deliveryTime} delivery</span>
            </div>

            <div class="tabs" style="margin-bottom: var(--space-lg);">
              <div class="tab active">Overview</div>
              <div class="tab">Specifications</div>
              <div class="tab">What's Included</div>
            </div>

            <!-- Overview Section -->
            <div class="info-section">
              <h2>Description</h2>
              <p style="white-space: pre-line;">${project.description}</p>
              
              <h3 class="heading-md" style="margin: var(--space-xl) 0 var(--space-sm);">Key Features</h3>
              <ul style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-sm);">
                ${project.features.map(f => `<li>${f}</li>`).join('')}
              </ul>

              <h3 class="heading-md" style="margin: var(--space-xl) 0 var(--space-sm);">Applications</h3>
              <ul style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-sm);">
                ${project.applications.map(a => `<li>${a}</li>`).join('')}
              </ul>
            </div>

            <!-- Specs Section (visible inline for now) -->
            <div class="info-section">
              <h2>Technical Specifications</h2>
              <div class="spec-grid">
                <div class="spec-item">
                  <div class="spec-label">Controller</div>
                  <div class="spec-value">${project.controller}</div>
                </div>
                <div class="spec-item">
                  <div class="spec-label">Power System</div>
                  <div class="spec-value">${project.powerSystem}</div>
                </div>
                <div class="spec-item" style="grid-column: 1/-1;">
                  <div class="spec-label">Sensors & Modules</div>
                  <div class="spec-value flex-wrap gap-xs">
                    ${project.sensors.map(s => `<span class="tag">${s}</span>`).join('')}
                  </div>
                </div>
                <div class="spec-item" style="grid-column: 1/-1;">
                  <div class="spec-label">Communication</div>
                  <div class="spec-value flex-wrap gap-xs">
                    ${project.communication.map(c => `<span class="tag">${c}</span>`).join('')}
                  </div>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h2>What's Included in the Kit</h2>
              <ul style="column-count: 2;">
                ${project.whatsIncluded.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>

        <!-- Right: Sticky Sidebar Pricing -->
        <div class="detail-sidebar reveal delay-2">
          <div class="glass-card price-card">
            <div class="badge badge-cyan" style="margin-bottom: var(--space-md);">${project.difficulty} Level</div>
            
            <div class="price-main">₹${formattedPrice}</div>
            <div class="price-note">Base price for ready-to-build kit. Taxes included.</div>
            
            <div class="flex-col gap-sm" style="margin-bottom: var(--space-xl);">
              <div class="flex-between text-sm">
                <span class="text-secondary"><i data-lucide="check-circle" style="width: 14px; color: var(--accent-green);"></i> Full Source Code</span>
              </div>
              <div class="flex-between text-sm">
                <span class="text-secondary"><i data-lucide="check-circle" style="width: 14px; color: var(--accent-green);"></i> Circuit Diagrams</span>
              </div>
              <div class="flex-between text-sm">
                <span class="text-secondary"><i data-lucide="check-circle" style="width: 14px; color: var(--accent-green);"></i> Setup Guide</span>
              </div>
            </div>

            <div class="flex-col gap-md">
              <button class="btn btn-primary btn-lg" style="width: 100%;" onclick="window.addToCartAndNavigate()">
                Buy Ready Project
              </button>
              
              <div class="text-center text-sm text-tertiary">OR</div>
              
              <a href="#/customizer?base=${project.id}" class="btn btn-secondary btn-lg" style="width: 100%;">
                <i data-lucide="sliders"></i> Customize This Project
              </a>
            </div>
            
            <div class="text-center text-xs text-tertiary" style="margin-top: var(--space-lg);">
              <i data-lucide="shield" style="width: 12px;"></i> 100% Quality Guarantee
            </div>
          </div>
          
          <!-- Tags summary -->
          <div class="glass-card" style="padding: var(--space-lg);">
            <h4 class="text-sm text-heading" style="margin-bottom: var(--space-md);">Project Tags</h4>
            <div class="flex-wrap gap-sm">
              ${project.tags.map(t => `<span class="tag">${t}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}
