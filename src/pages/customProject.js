import { store } from '../store.js';

export function CustomProjectPage(container) {
  
  window.submitCustomProject = async (e) => {
    e.preventDefault();
    
    const quoteData = {
      name: e.target[0].value,
      email: e.target[1].value,
      phone: e.target[2].value,
      role: e.target[3].value,
      projectName: e.target[4].value,
      category: e.target[5].value,
      controller: e.target[6].value,
      description: e.target[7].value,
      budget: e.target[8].value,
      timeline: e.target[9].value
    };
    
    const success = await store.submitCustomQuote(quoteData);
    if (!success) {
      alert("Failed to submit request. Please try again.");
      return;
    }
    
    const formGrid = document.getElementById('custom-project-form-grid');
    const successMsg = document.getElementById('custom-project-success');
    const header = document.getElementById('custom-project-header');
    
    if (formGrid && successMsg && header) {
      formGrid.style.display = 'none';
      header.style.display = 'none';
      successMsg.style.display = 'block';
      successMsg.classList.add('animate-fade-in-up');
    }
  };
  
  container.innerHTML = `
    <div class="custom-project-page container section">
      <div id="custom-project-header" class="section-header reveal">
        <h1 class="heading-xl">Have Your Own Project Idea?</h1>
        <p class="text-secondary" style="max-width: 600px; margin: var(--space-md) auto 0;">
          Tell us exactly what you want to build. Our team of expert engineers will design, develop, and deliver it for you.
        </p>
        <div class="accent-line"></div>
      </div>

      <div class="custom-project-form reveal delay-1">
        <form id="custom-project-form-grid" onsubmit="submitCustomProject(event)">
          <div class="glass-card" style="padding: var(--space-2xl);">
            
            <h3 class="heading-md" style="margin-bottom: var(--space-xl); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-sm);">Personal Information</h3>
            
            <div class="form-grid" style="margin-bottom: var(--space-2xl);">
              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input type="text" class="form-input" required placeholder="John Doe">
              </div>
              
              <div class="form-group">
                <label class="form-label">Email Address *</label>
                <input type="email" class="form-input" required placeholder="john@example.com">
              </div>
              
              <div class="form-group">
                <label class="form-label">Phone Number *</label>
                <input type="tel" class="form-input" required placeholder="+91 9876543210">
              </div>
              
              <div class="form-group">
                <label class="form-label">Profession / Role</label>
                <select class="form-input">
                  <option>Student</option>
                  <option>Hobbyist / Maker</option>
                  <option>Professional Engineer</option>
                  <option>Business / Startup</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <h3 class="heading-md" style="margin-bottom: var(--space-xl); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-sm);">Project Details</h3>
            
            <div class="form-grid">
              <div class="form-group full-width">
                <label class="form-label">Project Name / Title *</label>
                <input type="text" class="form-input" required placeholder="E.g. Smart Drone Delivery System">
              </div>
              
              <div class="form-group">
                <label class="form-label">Project Category</label>
                <select class="form-input">
                  <option>Internet of Things (IoT)</option>
                  <option>Robotics & Automation</option>
                  <option>Home/Industrial Automation</option>
                  <option>Embedded Linux/Raspberry Pi</option>
                  <option>PCB Design & Hardware</option>
                  <option>Other</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Preferred Controller (if any)</label>
                <input type="text" class="form-input" placeholder="E.g. ESP32, Raspberry Pi 4">
              </div>
              
              <div class="form-group full-width">
                <label class="form-label">Detailed Project Description *</label>
                <textarea class="form-input" required style="min-height: 150px;" placeholder="Describe what the project should do, what sensors it uses, how it communicates, and what the final output should be..."></textarea>
              </div>
              
              <div class="form-group full-width">
                <label class="form-label">Upload Reference Files (Block diagrams, sketches, requirements PDF)</label>
                <div class="file-upload">
                  <i data-lucide="upload-cloud" class="upload-icon"></i>
                  <p>Drag and drop files here or click to browse</p>
                  <div class="upload-hint">Max 5 files. Up to 10MB each.</div>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Estimated Budget</label>
                <select class="form-input">
                  <option>Under ₹5,000</option>
                  <option>₹5,000 - ₹15,000</option>
                  <option>₹15,000 - ₹50,000</option>
                  <option>Above ₹50,000</option>
                  <option>Not Sure</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Required Timeline</label>
                <select class="form-input">
                  <option>ASAP (Within 1 week)</option>
                  <option>1-2 Weeks</option>
                  <option>1 Month</option>
                  <option>Flexible</option>
                </select>
              </div>
            </div>
            
            <div style="margin-top: var(--space-2xl); text-align: center;">
              <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; max-width: 400px;">
                Submit Project Requirement
              </button>
              <p class="text-xs text-tertiary" style="margin-top: var(--space-md);">We typically respond with a quotation within 24 hours.</p>
            </div>
            
          </div>
        </form>
        
        <!-- Success Message (Hidden by default) -->
        <div id="custom-project-success" style="display: none;">
          <div class="success-message glass-card">
            <div class="success-icon"><i data-lucide="check"></i></div>
            <h2>Project Request Received!</h2>
            <p>Thank you for submitting your project idea. Our engineering team will review your requirements and get back to you with a detailed quotation within 24 hours.</p>
            
            <div style="margin-top: var(--space-2xl);">
              <p class="text-sm text-tertiary" style="margin-bottom: var(--space-md);">Your Request ID is: <strong style="color:var(--text-primary); font-family:var(--font-mono);">REQ-${Date.now().toString().slice(-6)}</strong></p>
              <a href="#/" class="btn btn-secondary">Return to Home</a>
              <a href="#/projects" class="btn btn-primary">Browse Projects</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}
