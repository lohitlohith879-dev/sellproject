// ============================================================
// CircuitKart — IoT Project Card Component
// ============================================================
import { store } from '../store.js';

export function IoTCard(project, options = {}) {
  const isFavorite = options.isFavorite || false;
  const formattedCost = new Intl.NumberFormat('en-IN').format(project.estimatedCost || 0);

  // Difficulty badge color class
  const diff = (project.difficulty || 'Intermediate').toLowerCase();
  let diffBadgeClass = 'badge-intermediate';
  if (diff === 'beginner') diffBadgeClass = 'badge-beginner';
  if (diff === 'advanced') diffBadgeClass = 'badge-advanced';

  // Key components pills (top 3)
  const componentsList = Array.isArray(project.components)
    ? project.components
    : (typeof project.components === 'string' ? JSON.parse(project.components || '[]') : []);

  const topComponents = componentsList.slice(0, 3).map(c => {
    const name = typeof c === 'string' ? c : (c.name || 'Component');
    return `<span class="iot-tag">${name}</span>`;
  }).join('');

  const isDemo = project.isDemo !== false;

  return `
    <div class="iot-card ${isDemo ? 'is-demo' : ''}" data-project-id="${project.id}">
      <div class="iot-card-media">
        <img 
          src="${project.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'}" 
          alt="${project.title}" 
          class="iot-card-img" 
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'"
        />
        <div class="iot-card-badges">
          <span class="iot-badge ${diffBadgeClass}">
            <i data-lucide="gauge" style="width:12px;height:12px;"></i>
            ${project.difficulty || 'Intermediate'}
          </span>
          ${isDemo ? `
            <span class="iot-badge badge-demo" title="Sample educational IoT project specification with simulated telemetry">
              <i data-lucide="flask-conical" style="width:12px;height:12px;"></i>
              DEMO PROJECT
            </span>
          ` : `
            <span class="iot-badge badge-verified">
              <i data-lucide="shield-check" style="width:12px;height:12px;"></i>
              VERIFIED
            </span>
          `}
        </div>

        <button 
          class="iot-fav-btn ${isFavorite ? 'favorited' : ''}" 
          title="${isFavorite ? 'Remove from favorites' : 'Save to favorites'}"
          data-fav-id="${project.id}"
          onclick="window.toggleIotFavorite && window.toggleIotFavorite('${project.id}', this, event)"
        >
          <i data-lucide="heart" style="width:16px;height:16px;${isFavorite ? 'fill:#ef4444;stroke:#ef4444;' : ''}"></i>
        </button>

        <div class="iot-platform-chip">
          <i data-lucide="cpu" style="width:12px;height:12px;"></i>
          ${project.platform || 'Microcontroller'}
        </div>
      </div>

      <div class="iot-card-content">
        <div class="iot-card-category">
          <span>${project.category || 'IoT & Embedded'}</span>
          <span class="iot-availability ${project.isKitAvailable ? 'available' : 'unavailable'}">
            <span class="status-dot"></span>
            ${project.isKitAvailable ? 'Kit Ready' : 'Digital Spec'}
          </span>
        </div>

        <h3 class="iot-card-title">
          <a href="#/iot-project/${project.slug}">${project.title}</a>
        </h3>

        <p class="iot-card-desc">
          ${project.shortDescription || project.description || ''}
        </p>

        <div class="iot-card-tags">
          ${topComponents}
          ${componentsList.length > 3 ? `<span class="iot-tag" style="opacity:0.6;">+${componentsList.length - 3} more</span>` : ''}
        </div>

        <div class="iot-card-footer">
          <div class="iot-price-block">
            <span class="iot-price-label">ESTIMATED HARDWARE</span>
            <div class="iot-price-val">₹${formattedCost}</div>
          </div>

          <div class="iot-card-actions">
            <a href="#/iot-project/${project.slug}" class="btn-iot btn-iot-outline" title="Open project technical overview, schematics & live simulator">
              <span>Details</span>
              <i data-lucide="arrow-right" style="width:14px;height:14px;"></i>
            </a>

            <button 
              class="btn-iot btn-iot-primary" 
              onclick="window.quickBuyIotKit && window.quickBuyIotKit('${project.id}', event)"
              title="${project.isKitAvailable ? 'Add complete project kit to cart' : 'Download code & view schematic'}"
            >
              <i data-lucide="${project.isKitAvailable ? 'shopping-bag' : 'code'}" style="width:14px;height:14px;"></i>
              <span>${project.isKitAvailable ? 'Get Kit' : 'Code'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
