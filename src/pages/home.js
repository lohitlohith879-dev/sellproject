import { store } from '../store.js';
import { ProjectCard } from '../components/projectCard.js';
import { CategoryCard } from '../components/categoryCard.js';

export function HomePage(container) {
  const projects = store.get('projects');
  // Get featured projects
  const featuredProjects = projects.filter(p => p.featured).slice(0, 4);
  const newProjects = [...projects].sort((a, b) => b.price - a.price).slice(0, 4);

  // Derive categories dynamically
  const categoryNames = [...new Set(projects.map(p => p.category).filter(Boolean))];
  const categories = categoryNames.map(name => ({
    id: name,
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
    slug: name,
    icon: name === 'arduino' ? 'cpu' : name === 'esp32' ? 'wifi' : name === 'robotics' ? 'bot' : 'box',
    projectCount: projects.filter(p => p.category === name).length
  }));

  container.innerHTML = `
    <!-- Hero Section -->
    <div class="hero reveal">
      <div class="hero-decoration">
        <div class="circuit-chip" style="top: 10%; left: 15%; animation: float 6s infinite;"></div>
        <div class="circuit-chip" style="bottom: 20%; right: 10%; animation: float 8s infinite 1s;"></div>
        <div class="glow-dot" style="top: 30%; left: 80%;"></div>
        <div class="glow-dot" style="top: 70%; left: 20%; animation-delay: 2s;"></div>
      </div>
      
      <div class="hero-content">
        <div class="hero-badge animate-fade-in-up">
          <i data-lucide="zap"></i> Welcome to CircuitKart
        </div>
        <h1 class="animate-fade-in-up delay-1">Build Your Own <br/><span class="gradient-text">Smart Project</span></h1>
        <p class="hero-subtitle animate-fade-in-up delay-2">
          Arduino, ESP32, IoT, Embedded Systems, Robotics & Automation Projects — Ready to Build or Fully Customized.
        </p>
        
        <!-- Search Bar -->
        <div class="search-wrapper animate-fade-in-up delay-3" style="margin-bottom: var(--space-2xl);">
          <i data-lucide="search" class="search-icon"></i>
          <input type="text" id="hero-search" placeholder="Search Arduino, ESP32, IoT projects..." onkeypress="if(event.key === 'Enter') location.hash='/projects?q='+this.value">
        </div>

        <div class="hero-buttons animate-fade-in-up delay-4">
          <a href="#/projects" class="btn btn-primary btn-lg">Explore Projects</a>
          <a href="#/customizer" class="btn btn-secondary btn-lg">Build Your Project</a>
        </div>
      </div>
    </div>

    <!-- Stats Banner -->
    <div class="usp-banner reveal">
      <div class="container">
        <div class="grid grid-3">
          <div class="hero-stat">
            <div class="stat-number">500+</div>
            <div class="stat-label">Projects Delivered</div>
          </div>
          <div class="hero-stat">
            <div class="stat-number">100%</div>
            <div class="stat-label">Source Code Provided</div>
          </div>
          <div class="hero-stat">
            <div class="stat-number">24/7</div>
            <div class="stat-label">Technical Support</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Categories Section -->
    <div class="section container reveal">
      <div class="section-header">
        <h2>Browse by Category</h2>
        <p>Explore our wide range of embedded systems and IoT projects.</p>
        <div class="accent-line"></div>
      </div>
      
      <div class="grid grid-5">
        ${categories.map(cat => CategoryCard(cat)).join('')}
      </div>
    </div>

    <!-- Featured Projects Section -->
    <div class="section container reveal">
      <div class="flex-between" style="margin-bottom: var(--space-2xl);">
        <div>
          <h2 class="heading-lg" style="margin-bottom: var(--space-xs);">Featured Projects</h2>
          <p class="text-secondary">Our most popular ready-to-build kits.</p>
        </div>
        <a href="#/projects" class="btn btn-ghost">View All <i data-lucide="arrow-right"></i></a>
      </div>
      
      <div class="grid grid-4">
        ${featuredProjects.map(p => ProjectCard(p)).join('')}
      </div>
    </div>

    <!-- Why Choose Us -->
    <div class="section container reveal" style="background: var(--bg-secondary); border-radius: var(--radius-xl); padding: var(--space-4xl);">
      <div class="section-header">
        <h2>Why Choose CircuitKart?</h2>
        <p>We provide professional-grade projects for students, hobbyists, and businesses.</p>
        <div class="accent-line"></div>
      </div>
      
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon"><i data-lucide="code"></i></div>
          <h3>Full Source Code</h3>
          <p>Get complete, well-commented source code with every project. No hidden logic.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i data-lucide="cpu"></i></div>
          <h3>Customizable</h3>
          <p>Use our 9-step wizard to customize any project exactly to your requirements.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i data-lucide="file-text"></i></div>
          <h3>Detailed Docs</h3>
          <p>Circuit diagrams, block diagrams, component lists, and setup instructions included.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i data-lucide="settings"></i></div>
          <h3>Premium Hardware</h3>
          <p>We use high-quality, tested components and offer custom PCB and enclosure options.</p>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="cta-section reveal">
      <h2>Have Your Own Project Idea?</h2>
      <p>Tell us what you want to build. Our team of expert engineers will design and develop it for you from scratch.</p>
      <a href="#/custom-project" class="btn btn-primary btn-lg">Request Custom Quote</a>
    </div>
  `;

  // Initialize icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
