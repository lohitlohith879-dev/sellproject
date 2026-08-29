import { customizationOptions } from '../data/customization.js';
import { pricing } from '../data/pricing.js';
import { projects } from '../data/projects.js';
import { store } from '../store.js';

export function CustomizerPage(container, params) {
  // Try to load base project if specified in URL (?base=project-id)
  const baseProject = params.base ? projects.find(p => p.id === params.base) : null;
  
  // Customizer State
  const state = {
    currentStep: 1,
    baseProject: baseProject,
    selections: {
      controller: baseProject ? baseProject.controller : null,
      sensors: baseProject ? [...baseProject.sensors] : [],
      communication: baseProject ? [...baseProject.communication] : [],
      display: baseProject && baseProject.display ? [...baseProject.display] : [],
      software: baseProject ? [...baseProject.software] : [],
      power: baseProject ? baseProject.powerSystem : null,
      hardware: baseProject ? baseProject.hardware : null,
      customRequirements: '',
      files: []
    }
  };

  const steps = [
    { id: 1, name: 'Controller', type: 'radio', key: 'controller', data: customizationOptions.controllers },
    { id: 2, name: 'Sensors', type: 'checkbox', key: 'sensors', data: customizationOptions.sensors },
    { id: 3, name: 'Communication', type: 'checkbox', key: 'communication', data: customizationOptions.communication },
    { id: 4, name: 'Display/Output', type: 'checkbox', key: 'display', data: customizationOptions.displays },
    { id: 5, name: 'Software', type: 'checkbox', key: 'software', data: customizationOptions.software },
    { id: 6, name: 'Power System', type: 'radio', key: 'power', data: customizationOptions.power },
    { id: 7, name: 'Hardware', type: 'radio', key: 'hardware', data: customizationOptions.hardware },
    { id: 8, name: 'Custom Req.', type: 'custom', key: 'customRequirements' },
    { id: 9, name: 'Summary', type: 'summary' }
  ];

  function calculateTotal() {
    let total = baseProject ? baseProject.price : pricing.customizationBaseCharge;
    
    // Add up prices for selected options
    if (!baseProject) {
      if (state.selections.controller && pricing.controllers[state.selections.controller]) {
        total += pricing.controllers[state.selections.controller];
      }
      state.selections.sensors.forEach(s => total += (pricing.sensors[s] || 0));
      state.selections.communication.forEach(c => total += (pricing.communication[c] || 0));
      state.selections.display.forEach(d => total += (pricing.displays[d] || 0));
      state.selections.software.forEach(s => total += (pricing.software[s] || 0));
      if (state.selections.power && pricing.power[state.selections.power]) {
        total += pricing.power[state.selections.power];
      }
      if (state.selections.hardware && pricing.hardware[state.selections.hardware]) {
        total += pricing.hardware[state.selections.hardware];
      }
    } else {
       total += pricing.customizationBaseCharge;
    }

    return total;
  }

  // Handle Selection Toggle
  window.toggleSelection = (stepKey, itemId, type) => {
    if (type === 'radio') {
      state.selections[stepKey] = itemId;
    } else if (type === 'checkbox') {
      const index = state.selections[stepKey].indexOf(itemId);
      if (index > -1) {
        state.selections[stepKey].splice(index, 1);
      } else {
        state.selections[stepKey].push(itemId);
      }
    }
    render();
  };

  window.goToStep = (step) => {
    if (step >= 1 && step <= 9) {
      state.currentStep = step;
      render();
    }
  };

  window.handleCustomText = (e) => {
    state.selections.customRequirements = e.value;
    renderPriceSidebar();
  };

  window.addToCartFromCustomizer = () => {
    const total = calculateTotal();
    const isQuoteNeeded = state.selections.customRequirements.trim().length > 0;
    
    if (isQuoteNeeded) {
      alert("Since you have custom requirements, we will save this as a quote request. Our team will review it and get back to you with an exact price.");
    }
    
    const cartItem = {
      id: baseProject ? baseProject.id : 'custom-project-' + Date.now(),
      name: baseProject ? `Customized ${baseProject.name}` : 'Fully Custom Project',
      price: isQuoteNeeded ? 0 : total,
      isQuote: isQuoteNeeded,
      image: baseProject ? baseProject.image : '',
      imageColor: baseProject ? baseProject.imageColor : '#16213e',
      customizations: state.selections
    };
    
    store.addToCart(cartItem);
    window.location.hash = '/cart';
  };

  function renderStepper() {
    return `
      <div class="stepper">
        ${steps.map((step, index) => `
          <div class="stepper-step">
            <div class="step-indicator" onclick="goToStep(${step.id})">
              <div class="step-circle ${state.currentStep === step.id ? 'active' : ''} ${state.currentStep > step.id ? 'completed' : ''}">
                ${state.currentStep > step.id ? '<i data-lucide="check" style="width: 16px;"></i>' : step.id}
              </div>
              <div class="step-label">${step.name}</div>
            </div>
            ${index < steps.length - 1 ? `
              <div class="step-line ${state.currentStep > step.id ? 'completed' : ''}"></div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderStepContent() {
    const step = steps.find(s => s.id === state.currentStep);
    
    if (step.type === 'radio' || step.type === 'checkbox') {
      return `
        <div class="step-content">
          <div class="text-center" style="margin-bottom: var(--space-xl);">
            <h3>Select ${step.name}</h3>
            <p class="step-desc">Choose the ${step.name.toLowerCase()} for your project.</p>
          </div>
          
          <div class="selection-grid">
            ${step.data.map(item => {
              const isSelected = step.type === 'radio' 
                ? state.selections[step.key] === item.id 
                : state.selections[step.key].includes(item.id);
                
              return `
                <div class="selection-card ${isSelected ? 'selected' : ''}" 
                     onclick="toggleSelection('${step.key}', '${item.id}', '${step.type}')">
                  <div class="sel-check"><i data-lucide="check" style="width: 12px;"></i></div>
                  <div class="sel-icon"><i data-lucide="${item.icon}"></i></div>
                  <div class="sel-name">${item.name}</div>
                  ${!baseProject && pricing[step.key === 'display' ? 'displays' : step.key][item.id] ? `
                    <div class="sel-price">+₹${pricing[step.key === 'display' ? 'displays' : step.key][item.id]}</div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
    
    if (step.type === 'custom') {
      return `
        <div class="step-content">
          <div class="text-center" style="margin-bottom: var(--space-xl);">
            <h3>Custom Requirements</h3>
            <p class="step-desc">Describe exactly what you want to modify or add to this project.</p>
          </div>
          
          <div class="form-group" style="margin-bottom: var(--space-xl);">
            <label class="form-label">Description</label>
            <textarea class="form-input" 
                      placeholder="E.g. I want the pump to automatically turn ON when soil moisture falls below 30%, and I want to control it from a web dashboard."
                      onkeyup="handleCustomText(this)"
                      onchange="handleCustomText(this)">${state.selections.customRequirements}</textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">Reference Files (Circuit diagrams, images, PDFs)</label>
            <div class="file-upload">
              <i data-lucide="upload-cloud" class="upload-icon"></i>
              <p>Drag and drop files here or click to browse</p>
              <div class="upload-hint">Supported formats: PDF, PNG, JPG, ZIP (Max 10MB)</div>
            </div>
            
            ${state.selections.files.length > 0 ? `
              <div class="file-list">
                <!-- Placeholder for uploaded files -->
                <div class="file-item">
                  <div class="file-name"><i data-lucide="file"></i> schematic.pdf</div>
                  <i data-lucide="x" style="cursor:pointer; color:var(--text-tertiary);"></i>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }
    
    if (step.type === 'summary') {
      const isQuoteNeeded = state.selections.customRequirements.trim().length > 0;
      
      return `
        <div class="step-content">
          <div class="text-center" style="margin-bottom: var(--space-xl);">
            <h3>Order Summary</h3>
            <p class="step-desc">Review your customized project before adding to cart.</p>
          </div>
          
          <div class="glass-card" style="padding: var(--space-2xl);">
            ${baseProject ? `
              <div class="flex-between" style="margin-bottom: var(--space-lg); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-md);">
                <div class="flex-center gap-md">
                  <div style="width: 60px; height: 60px; border-radius: var(--radius-sm); background-color: ${baseProject.imageColor || '#0f3460'};"></div>
                  <div>
                    <h4 class="heading-sm">${baseProject.name}</h4>
                    <span class="text-xs text-tertiary">Base Project</span>
                  </div>
                </div>
                <div class="font-mono text-lg font-bold">₹${new Intl.NumberFormat('en-IN').format(baseProject.price)}</div>
              </div>
            ` : ''}
            
            <div class="order-summary-table">
              <div class="summary-row">
                <span class="row-label">Controller</span>
                <span class="row-value">${state.selections.controller || 'None Selected'}</span>
              </div>
              <div class="summary-row">
                <span class="row-label">Sensors</span>
                <span class="row-value">${state.selections.sensors.length > 0 ? state.selections.sensors.join(', ') : 'None'}</span>
              </div>
              <div class="summary-row">
                <span class="row-label">Communication</span>
                <span class="row-value">${state.selections.communication.length > 0 ? state.selections.communication.join(', ') : 'None'}</span>
              </div>
              <div class="summary-row">
                <span class="row-label">Display/Output</span>
                <span class="row-value">${state.selections.display.length > 0 ? state.selections.display.join(', ') : 'None'}</span>
              </div>
              <div class="summary-row">
                <span class="row-label">Software</span>
                <span class="row-value">${state.selections.software.length > 0 ? state.selections.software.join(', ') : 'None'}</span>
              </div>
              <div class="summary-row">
                <span class="row-label">Power System</span>
                <span class="row-value">${state.selections.power || 'None Selected'}</span>
              </div>
              <div class="summary-row">
                <span class="row-label">Hardware</span>
                <span class="row-value">${state.selections.hardware || 'None Selected'}</span>
              </div>
              
              ${isQuoteNeeded ? `
                <div class="summary-row" style="background: rgba(255, 145, 0, 0.1); padding: var(--space-md); border-radius: var(--radius-md); margin-top: var(--space-md);">
                  <span class="row-label" style="color: var(--accent-orange);">Custom Requirements Added</span>
                  <span class="row-value">Requires Quotation</span>
                </div>
              ` : `
                <div class="summary-row total">
                  <span class="row-label">Estimated Total</span>
                  <span class="row-value">₹${new Intl.NumberFormat('en-IN').format(calculateTotal())}</span>
                </div>
              `}
            </div>
            
            <div style="margin-top: var(--space-2xl); text-align: center;">
              ${isQuoteNeeded ? `
                <button class="btn btn-primary btn-lg" onclick="addToCartFromCustomizer()">
                  Request Custom Quote
                </button>
                <p class="text-xs text-tertiary" style="margin-top: var(--space-sm);">Our team will review your requirements and provide an exact price.</p>
              ` : `
                <button class="btn btn-primary btn-lg" onclick="addToCartFromCustomizer()">
                  Add Customized Project to Cart
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }
  }

  function renderPriceSidebar() {
    const priceSidebar = document.getElementById('price-summary-bar');
    if (priceSidebar) {
      const isQuoteNeeded = state.selections.customRequirements.trim().length > 0;
      priceSidebar.innerHTML = `
        <div class="estimated-total">
          <div class="label">Estimated Total</div>
          <div class="amount">${isQuoteNeeded ? 'Request Quote' : '₹' + new Intl.NumberFormat('en-IN').format(calculateTotal())}</div>
        </div>
        <div class="flex gap-sm">
          ${state.currentStep > 1 ? `
            <button class="btn btn-secondary" onclick="goToStep(${state.currentStep - 1})">Back</button>
          ` : ''}
          ${state.currentStep < 9 ? `
            <button class="btn btn-primary" onclick="goToStep(${state.currentStep + 1})">Next Step</button>
          ` : ''}
        </div>
      `;
    }
  }

  function render() {
    container.innerHTML = `
      <div class="customizer-page container section">
        <div class="customizer-header reveal">
          <h1 class="heading-xl">Build Your Project</h1>
          <p class="text-secondary" style="max-width: 600px; margin: 0 auto;">
            Customize every aspect of your project. We'll build it exactly the way you want.
          </p>
        </div>

        <div class="customizer-body reveal delay-1">
          ${renderStepper()}
          
          <div style="min-height: 400px; padding-bottom: 100px;">
            ${renderStepContent()}
          </div>
        </div>

        <div id="price-summary-bar" class="price-summary">
          <!-- Populated by renderPriceSidebar -->
        </div>
      </div>
    `;

    renderPriceSidebar();
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Initial render
  render();
}
