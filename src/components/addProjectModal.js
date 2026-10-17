// src/components/addProjectModal.js
// Admin Modal for Creating and Editing Projects in the Dashboards

const API_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API = API_URL ? `${API_URL}/api` : '/api';

export function openAddProjectModal({ defaultCategory = 'iot', project = null, onSaved = null } = {}) {
  const isEdit = !!project;
  const slot = document.getElementById('modal-root') || document.body;

  let modalEl = document.getElementById('pj-admin-modal-wrap');
  if (modalEl) modalEl.remove();

  modalEl = document.createElement('div');
  modalEl.id = 'pj-admin-modal-wrap';

  const titleVal = project?.title || '';
  const categoryVal = project?.category || defaultCategory || 'iot';
  const subcategoryVal = project?.subcategory || '';
  const statusVal = project?.status || 'Completed';
  const shortDescVal = project?.shortDescription || '';
  const descVal = project?.description || '';
  const coverImageVal = project?.coverImage || '';
  const screenshotsVal = Array.isArray(project?.screenshots) ? project.screenshots.join(', ') : '';
  const hardwareVal = Array.isArray(project?.hardwareComponents) ? project.hardwareComponents.join(', ') : (project?.hardwareComponents || '');
  const techVal = Array.isArray(project?.technologies) ? project.technologies.join(', ') : '';
  const githubUrlVal = project?.githubUrl || '';
  const demoVideoUrlVal = project?.demoVideoUrl || '';
  const liveWebsiteUrlVal = project?.liveWebsiteUrl || '';
  const problemVal = project?.problemStatement || '';
  const solutionVal = project?.proposedSolution || '';
  const workingVal = project?.workingPrinciple || '';
  const resultsVal = project?.results || '';
  const isPublished = project ? project.published : true;

  modalEl.innerHTML = `
    <div class="pj-modal-overlay" id="pj-modal-backdrop">
      <div class="pj-modal-box">
        <div class="pj-modal-header">
          <h3>
            <i data-lucide="${isEdit ? 'edit-3' : 'plus-circle'}" style="width:20px; color:#00f2fe; vertical-align:middle; margin-right:8px;"></i>
            ${isEdit ? 'Edit Project Details' : 'Add New Engineering Project'}
          </h3>
          <button style="background:none; border:none; color:#94a3b8; cursor:pointer;" onclick="window.closeAddProjectModal()">
            <i data-lucide="x" style="width:20px;"></i>
          </button>
        </div>

        <form id="pj-project-form" onsubmit="window.submitProjectForm(event, ${isEdit ? `'${project.id}'` : 'null'})">
          <div class="pj-modal-body">
            
            <!-- Category and Status -->
            <div class="pj-form-grid-2">
              <div class="pj-form-group">
                <label class="pj-form-label">Project Category *</label>
                <select id="pj-category" class="pj-form-control" onchange="window.toggleCategoryFields(this.value)" required>
                  <option value="iot" ${categoryVal === 'iot' ? 'selected' : ''}>IoT & Embedded Systems</option>
                  <option value="web" ${categoryVal === 'web' ? 'selected' : ''}>Web Development</option>
                </select>
              </div>

              <div class="pj-form-group">
                <label class="pj-form-label">Project Status *</label>
                <select id="pj-status" class="pj-form-control" required>
                  <option value="Completed" ${statusVal === 'Completed' ? 'selected' : ''}>Completed</option>
                  <option value="In Progress" ${statusVal === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Planned" ${statusVal === 'Planned' ? 'selected' : ''}>Planned</option>
                </select>
              </div>
            </div>

            <!-- Title & Subcategory -->
            <div class="pj-form-grid-2">
              <div class="pj-form-group">
                <label class="pj-form-label">Project Title *</label>
                <input type="text" id="pj-title" class="pj-form-control" required placeholder="e.g. Smart Autonomous Farm Monitoring" value="${titleVal}" />
              </div>

              <div class="pj-form-group">
                <label class="pj-form-label">Subcategory / Domain</label>
                <input type="text" id="pj-subcategory" class="pj-form-control" placeholder="e.g. Smart Agriculture or E-Commerce" value="${subcategoryVal}" />
              </div>
            </div>

            <!-- Short Description -->
            <div class="pj-form-group">
              <label class="pj-form-label">Short Summary Description *</label>
              <textarea id="pj-short-desc" class="pj-form-control" rows="2" required placeholder="Concise summary for project card...">${shortDescVal}</textarea>
            </div>

            <!-- Cover Image URL -->
            <div class="pj-form-group">
              <label class="pj-form-label">Cover Image URL</label>
              <input type="url" id="pj-cover-image" class="pj-form-control" placeholder="https://images.unsplash.com/..." value="${coverImageVal}" />
            </div>

            <!-- Hardware Components (IoT only) -->
            <div class="pj-form-group" id="pj-hw-group" style="${categoryVal === 'web' ? 'display:none;' : ''}">
              <label class="pj-form-label">Hardware Components (Comma separated)</label>
              <input type="text" id="pj-hardware" class="pj-form-control" placeholder="ESP32, Soil Moisture Sensor, 5V Relay Module, OLED..." value="${hardwareVal}" />
            </div>

            <!-- Technologies Used -->
            <div class="pj-form-group">
              <label class="pj-form-label">Software & Technologies Used (Comma separated) *</label>
              <input type="text" id="pj-technologies" class="pj-form-control" required placeholder="C++, Arduino Core, MQTT, Python, React, Node.js..." value="${techVal}" />
            </div>

            <!-- External Links (GitHub, Demo, Live) -->
            <div class="pj-form-grid-2">
              <div class="pj-form-group">
                <label class="pj-form-label">GitHub Repository URL</label>
                <input type="url" id="pj-github-url" class="pj-form-control" placeholder="https://github.com/..." value="${githubUrlVal}" />
              </div>

              <div class="pj-form-group">
                <label class="pj-form-label">Demo Video URL</label>
                <input type="url" id="pj-demo-video-url" class="pj-form-control" placeholder="https://youtube.com/..." value="${demoVideoUrlVal}" />
              </div>
            </div>

            <div class="pj-form-group" id="pj-live-group" style="${categoryVal === 'iot' ? 'display:none;' : ''}">
              <label class="pj-form-label">Live Website URL</label>
              <input type="url" id="pj-live-website-url" class="pj-form-control" placeholder="https://myproject.vercel.app/" value="${liveWebsiteUrlVal}" />
            </div>

            <!-- Problem Statement & Solution -->
            <div class="pj-form-grid-2">
              <div class="pj-form-group">
                <label class="pj-form-label">Problem Statement</label>
                <textarea id="pj-problem" class="pj-form-control" rows="3" placeholder="What challenge does this solve?">${problemVal}</textarea>
              </div>

              <div class="pj-form-group">
                <label class="pj-form-label">Proposed Solution</label>
                <textarea id="pj-solution" class="pj-form-control" rows="3" placeholder="How is the system architected?">${solutionVal}</textarea>
              </div>
            </div>

            <!-- Working Principle & Results -->
            <div class="pj-form-grid-2">
              <div class="pj-form-group">
                <label class="pj-form-label">Working Principle / Architecture</label>
                <textarea id="pj-working" class="pj-form-control" rows="2" placeholder="Sensors sample telemetry, microcontroller triggers...">${workingVal}</textarea>
              </div>

              <div class="pj-form-group">
                <label class="pj-form-label">Project Results & Milestones</label>
                <textarea id="pj-results" class="pj-form-control" rows="2" placeholder="Achieved 42% water savings...">${resultsVal}</textarea>
              </div>
            </div>

            <!-- Published Checkbox -->
            <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
              <input type="checkbox" id="pj-published" ${isPublished ? 'checked' : ''} style="width:16px; height:16px; accent-color:#00f2fe;" />
              <label for="pj-published" style="font-size:13px; color:#e2e8f0; cursor:pointer;">
                Publish this project immediately (visible on public dashboard)
              </label>
            </div>

          </div>

          <div class="pj-modal-footer">
            <button type="button" class="pj-action-btn-secondary" onclick="window.closeAddProjectModal()">Cancel</button>
            <button type="submit" id="pj-submit-btn" class="pj-action-btn-primary">
              <i data-lucide="save" style="width:16px;"></i> ${isEdit ? 'Update Project' : 'Publish Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  slot.appendChild(modalEl);
  if (window.lucide) window.lucide.createIcons();

  window.closeAddProjectModal = () => {
    const el = document.getElementById('pj-admin-modal-wrap');
    if (el) el.remove();
  };

  window.toggleCategoryFields = (val) => {
    const hwGroup = document.getElementById('pj-hw-group');
    const liveGroup = document.getElementById('pj-live-group');
    if (hwGroup) hwGroup.style.display = val === 'web' ? 'none' : 'block';
    if (liveGroup) liveGroup.style.display = val === 'iot' ? 'none' : 'block';
  };

  window.submitProjectForm = async (e, projectId) => {
    e.preventDefault();
    const btn = document.getElementById('pj-submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" style="width:14px; height:14px; display:inline-block; border-width:2px;"></span> Saving...';
    }

    const token = localStorage.getItem('ck_admin_token') || localStorage.getItem('ck_token');
    const category = document.getElementById('pj-category').value;
    const title = document.getElementById('pj-title').value.trim();
    const subcategory = document.getElementById('pj-subcategory').value.trim();
    const status = document.getElementById('pj-status').value;
    const shortDescription = document.getElementById('pj-short-desc').value.trim();
    const coverImage = document.getElementById('pj-cover-image').value.trim() || 
      (category === 'iot' 
        ? 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' 
        : 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80');
    
    const hardwareRaw = document.getElementById('pj-hardware')?.value || '';
    const hardwareComponents = hardwareRaw.split(',').map(s => s.trim()).filter(Boolean);
    const techRaw = document.getElementById('pj-technologies').value;
    const technologies = techRaw.split(',').map(s => s.trim()).filter(Boolean);
    const githubUrl = document.getElementById('pj-github-url').value.trim();
    const demoVideoUrl = document.getElementById('pj-demo-video-url').value.trim();
    const liveWebsiteUrl = document.getElementById('pj-live-website-url')?.value.trim() || '';
    const problemStatement = document.getElementById('pj-problem').value.trim();
    const proposedSolution = document.getElementById('pj-solution').value.trim();
    const workingPrinciple = document.getElementById('pj-working').value.trim();
    const results = document.getElementById('pj-results').value.trim();
    const published = document.getElementById('pj-published').checked ? 1 : 0;

    const payload = {
      title,
      category,
      subcategory,
      status,
      shortDescription,
      description: shortDescription,
      overview: shortDescription,
      coverImage,
      hardwareComponents,
      technologies,
      githubUrl,
      demoVideoUrl,
      liveWebsiteUrl,
      problemStatement,
      proposedSolution,
      workingPrinciple,
      results,
      published
    };

    try {
      const url = projectId ? `${API}/project-dashboards/${projectId}` : `${API}/project-dashboards`;
      const method = projectId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        window.closeAddProjectModal();
        if (typeof onSaved === 'function') {
          onSaved();
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to save project. Ensure you are logged in as admin.');
      }
    } catch (err) {
      alert('Network error while saving project: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="save" style="width:16px;"></i> ${isEdit ? 'Update Project' : 'Publish Project'}`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  };
}
