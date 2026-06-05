// app.js
// Logic điều khiển chính của Webapp Quản lý công việc (Đã bổ sung bộ lọc, thẻ, phòng ban và ẩn cột)

import { State, DEFAULT_DEPARTMENTS } from './state.js';
import { DragDropManager } from './dragdrop.js';

// --- Trạng thái Giao diện Hiện tại ---
let currentView = 'dashboard';
let selectedProjectId = null;
let projectDetailTab = 'kanban';
let dragDropManager = null;

// --- Các biến Bộ lọc cục bộ ---
let filterDept = ''; // Lọc phòng ban ở view Dự án
let filterTaskStatus = 'all'; // Lọc trạng thái công việc ('all', 'in-progress-only', 'done-only')

// --- Các phần tử DOM thông dụng ---
const DOM = {
  viewTitle: document.getElementById('view-title'),
  viewSubtitle: document.getElementById('view-subtitle'),
  btnHeaderAction: document.getElementById('btn-header-action'),
  textHeaderAction: document.getElementById('text-header-action'),
  navItems: document.querySelectorAll('.nav-item'),
  viewPanels: document.querySelectorAll('.view-panel'),
  
  // Theme toggles
  themeToggleDesktop: document.getElementById('theme-toggle-desktop'),
  themeToggleMobile: document.getElementById('theme-toggle-mobile'),
  
  // Views
  viewDashboard: document.getElementById('view-dashboard'),
  viewProjects: document.getElementById('view-projects'),
  viewProjectDetail: document.getElementById('view-project-detail'),
  viewMatrix: document.getElementById('view-matrix'),
  viewTags: document.getElementById('view-tags'),
  viewMembers: document.getElementById('view-members'),
  
  // Modals
  modalProject: document.getElementById('modal-project'),
  modalTask: document.getElementById('modal-task'),
  modalMember: document.getElementById('modal-member'),
};

// --- Khởi tạo ứng dụng ---
document.addEventListener('DOMContentLoaded', () => {
  State.init();
  applyTheme(State.theme);
  dragDropManager = new DragDropManager(handleDragEnd);
  setupEventListeners();
  switchView('dashboard');
});

// --- Đồng bộ & Đổi chủ đề Sáng / Tối ---
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const sunIcons = document.querySelectorAll('.sun-icon');
  const moonIcons = document.querySelectorAll('.moon-icon');
  const themeTexts = document.querySelectorAll('.theme-text');

  if (theme === 'dark') {
    sunIcons.forEach(el => el.style.display = 'block');
    moonIcons.forEach(el => el.style.display = 'none');
    themeTexts.forEach(el => el.textContent = 'Chế độ sáng');
  } else {
    sunIcons.forEach(el => el.style.display = 'none');
    moonIcons.forEach(el => el.style.display = 'block');
    themeTexts.forEach(el => el.textContent = 'Chế độ tối');
  }
}

function toggleTheme() {
  const newTheme = State.theme === 'light' ? 'dark' : 'light';
  State.setTheme(newTheme);
  applyTheme(newTheme);
}

// --- Quản lý Điều hướng (Router) ---
function switchView(viewName, projectId = null) {
  currentView = viewName;
  selectedProjectId = projectId;

  // Cập nhật active Sidebar
  DOM.navItems.forEach(item => {
    const itemView = item.getAttribute('data-view');
    if (itemView === viewName || (viewName === 'project-detail' && itemView === 'projects')) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Hiển thị panel tương ứng
  DOM.viewPanels.forEach(panel => {
    panel.classList.remove('active');
  });

  const activePanelId = `view-${viewName === 'project-detail' ? 'project-detail' : viewName}`;
  const activePanel = document.getElementById(activePanelId);
  if (activePanel) {
    activePanel.classList.add('active');
  }

  updateHeader();
  renderCurrentView();
  window.scrollTo(0, 0);
}

function updateHeader() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const todayStr = 'Hôm nay: ' + new Date().toLocaleDateString('vi-VN', options);
  DOM.viewSubtitle.textContent = todayStr;
  DOM.btnHeaderAction.style.display = 'inline-flex';

  switch (currentView) {
    case 'dashboard':
      DOM.viewTitle.textContent = 'Tổng quan hệ thống';
      DOM.textHeaderAction.textContent = 'Tạo dự án mới';
      break;
    case 'projects':
      DOM.viewTitle.textContent = 'Danh sách Dự án';
      DOM.textHeaderAction.textContent = 'Tạo dự án mới';
      break;
    case 'project-detail':
      DOM.viewTitle.textContent = 'Chi tiết Dự án';
      DOM.btnHeaderAction.style.display = 'none';
      break;
    case 'matrix':
      DOM.viewTitle.textContent = 'Ma trận Eisenhower';
      DOM.textHeaderAction.textContent = 'Tạo dự án mới';
      break;
    case 'tags':
      DOM.viewTitle.textContent = 'Quản lý Nhãn thẻ';
      DOM.btnHeaderAction.style.display = 'none'; // Đã có form trực tiếp trên trang quản lý thẻ
      break;
    case 'members':
      DOM.viewTitle.textContent = 'Thành viên Đội ngũ';
      DOM.textHeaderAction.textContent = 'Thêm thành viên';
      break;
  }
}

function renderCurrentView() {
  switch (currentView) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'projects':
      renderProjects();
      break;
    case 'project-detail':
      renderProjectDetail();
      break;
    case 'matrix':
      renderMatrix();
      break;
    case 'tags':
      renderTagsView();
      break;
    case 'members':
      renderMembers();
      break;
  }
}

// --- THIẾT LẬP LẮNG NGHE SỰ KIỆN ---
function setupEventListeners() {
  DOM.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const viewName = item.getAttribute('data-view');
      switchView(viewName);
    });
  });

  DOM.themeToggleDesktop.addEventListener('click', toggleTheme);
  DOM.themeToggleMobile.addEventListener('click', toggleTheme);

  DOM.btnHeaderAction.addEventListener('click', () => {
    if (currentView === 'members') {
      openMemberModal();
    } else {
      openProjectModal();
    }
  });

  document.getElementById('btn-back-to-projects').addEventListener('click', () => {
    switchView('projects');
  });

  document.getElementById('btn-edit-project-settings').addEventListener('click', () => {
    if (selectedProjectId) {
      openProjectModal(selectedProjectId);
    }
  });

  document.getElementById('btn-add-task-to-project').addEventListener('click', () => {
    if (selectedProjectId) {
      openTaskModal(null, selectedProjectId);
    }
  });

  // Chuyển tab hiển thị (Kanban vs List)
  const tabKanban = document.getElementById('tab-kanban');
  const tabList = document.getElementById('tab-list');

  tabKanban.addEventListener('click', () => {
    projectDetailTab = 'kanban';
    tabKanban.classList.add('active');
    tabList.classList.remove('active');
    document.getElementById('project-detail-kanban').style.display = 'grid';
    document.getElementById('project-detail-list').style.display = 'none';
    renderProjectDetail();
  });

  tabList.addEventListener('click', () => {
    projectDetailTab = 'list';
    tabList.classList.add('active');
    tabKanban.classList.remove('active');
    document.getElementById('project-detail-kanban').style.display = 'none';
    document.getElementById('project-detail-list').style.display = 'block';
    renderProjectDetail();
  });

  // --- Sự kiện Bộ lọc ---
  // Lọc phòng ban ở trang dự án
  document.getElementById('filter-project-dept').addEventListener('change', (e) => {
    filterDept = e.target.value;
    renderProjects();
  });

  // Lọc trạng thái công việc ở chi tiết dự án
  document.getElementById('filter-task-status').addEventListener('change', (e) => {
    filterTaskStatus = e.target.value;
    renderProjectDetail();
  });

  // Tùy chọn ẩn hiện cột Kanban
  const colToggles = document.querySelectorAll('.column-visibility-toggle');
  colToggles.forEach(toggle => {
    toggle.addEventListener('change', () => {
      if (!selectedProjectId) return;
      const project = State.projects.find(p => p.id === selectedProjectId);
      if (!project) return;

      const checkedCols = [];
      colToggles.forEach(cb => {
        if (cb.checked) checkedCols.push(cb.value);
      });

      if (checkedCols.length === 0) {
        alert('Bạn phải hiển thị ít nhất một cột trạng thái trên Kanban!');
        toggle.checked = true; // khôi phục check
        return;
      }

      State.updateProject(selectedProjectId, { visibleColumns: checkedCols });
      renderProjectDetail();
    });
  });

  // --- Sự kiện trang Quản lý nhãn thẻ (Tags) ---
  document.getElementById('btn-save-tag-direct').addEventListener('click', saveTagDirectForm);
  document.getElementById('btn-cancel-tag-direct').addEventListener('click', resetTagDirectForm);
  
  const tagColorOpts = document.querySelectorAll('#tag-direct-color-picker .color-option');
  tagColorOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      tagColorOpts.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  // --- Sự kiện đóng/mở/lưu Modals ---
  document.getElementById('btn-close-project-modal').addEventListener('click', closeProjectModal);
  document.getElementById('btn-cancel-project').addEventListener('click', closeProjectModal);
  document.getElementById('btn-save-project').addEventListener('click', saveProjectForm);
  document.getElementById('btn-delete-project').addEventListener('click', deleteProjectFromForm);

  document.getElementById('btn-close-task-modal').addEventListener('click', closeTaskModal);
  document.getElementById('btn-cancel-task').addEventListener('click', closeTaskModal);
  document.getElementById('btn-save-task').addEventListener('click', saveTaskForm);

  document.getElementById('btn-close-member-modal').addEventListener('click', closeMemberModal);
  document.getElementById('btn-cancel-member').addEventListener('click', closeMemberModal);
  document.getElementById('btn-save-member').addEventListener('click', saveMemberForm);

  const colorOptions = document.querySelectorAll('#member-form-color-picker .color-option');
  colorOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      colorOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });
}

// --- XỬ LÝ KÉO THẢ SAU KHI THẢ CHUỘT ---
function handleDragEnd(result) {
  const { type, id, parentId, fromIndex, toIndex, newStatus, newQuadrant } = result;

  if (type === 'project-list') {
    State.reorderProjects(fromIndex, toIndex);
    renderProjects();
  } else if (type === 'task-list') {
    // Để sắp xếp đúng index khi đang bật bộ lọc: chúng ta cần ánh xạ lại chỉ mục của mảng lọc về mảng gốc
    // Tuy nhiên để đơn giản và tin cậy, chúng ta cập nhật trực tiếp trong dự án dựa trên các công việc thực tế hiển thị
    const project = State.projects.find(p => p.id === parentId);
    if (!project) return;
    
    const filteredTasks = getFilteredTasks(project.tasks);
    const targetTask = filteredTasks[fromIndex];
    if (!targetTask) return;

    const originalFromIdx = project.tasks.findIndex(t => t.id === targetTask.id);
    
    // Tìm phần tử đích thực sự trong mảng gốc
    let originalToIdx;
    if (toIndex >= filteredTasks.length) {
      originalToIdx = project.tasks.length;
    } else {
      const destinationTask = filteredTasks[toIndex];
      originalToIdx = project.tasks.findIndex(t => t.id === destinationTask.id);
    }

    State.reorderTasks(parentId, originalFromIdx, originalToIdx);
    renderProjectDetail();
  } else if (type === 'task-kanban') {
    State.moveTaskStatus(parentId, id, newStatus, toIndex);
    renderProjectDetail();
  } else if (type === 'project-matrix') {
    State.updateProject(id, { quadrant: newQuadrant });
    renderMatrix();
  }
}

// Hàm lọc công việc phụ trợ
function getFilteredTasks(tasks) {
  if (filterTaskStatus === 'in-progress-only') {
    return tasks.filter(t => t.status === 'in-progress');
  } else if (filterTaskStatus === 'done-only') {
    return tasks.filter(t => t.status === 'done');
  }
  return tasks;
}

// ----------------------------------------------------
// KẾT XUẤT CÁC PANEL (Rendering)
// ----------------------------------------------------

// 1. Render Dashboard
function renderDashboard() {
  const projects = State.projects;
  const members = State.members;

  const totalProjects = projects.length;
  const urgentProjects = projects.filter(p => p.quadrant === 1).length;
  
  let completedTasks = 0;
  projects.forEach(p => {
    completedTasks += p.tasks.filter(t => t.status === 'done').length;
  });
  const totalMembers = members.length;

  document.getElementById('stat-total-projects').textContent = totalProjects;
  document.getElementById('stat-urgent-projects').textContent = urgentProjects;
  document.getElementById('stat-completed-tasks').textContent = completedTasks;
  document.getElementById('stat-total-members').textContent = totalMembers;

  const q1ProjectsContainer = document.getElementById('dashboard-q1-projects');
  const q1Projects = projects.filter(p => p.quadrant === 1);
  
  if (q1Projects.length === 0) {
    q1ProjectsContainer.innerHTML = '<p class="text-muted" style="font-size:0.9rem;">Không có dự án khẩn cấp nào cần xử lý ngay.</p>';
  } else {
    q1ProjectsContainer.innerHTML = q1Projects.map(p => {
      const doneTasks = p.tasks.filter(t => t.status === 'done').length;
      const totalTasks = p.tasks.length;
      const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      
      return `
        <div class="project-quick-card" style="cursor:pointer;" onclick="window.app.openProject('${p.id}')">
          <div>
            <div class="project-name">${escapeHTML(p.name)}</div>
            <div class="project-tasks-count">${totalTasks} công việc (Đã hoàn thành ${progressPercent}%)</div>
          </div>
          <span class="project-quadrant-badge" style="color:var(--q1-color);background-color:var(--q1-bg)">Khẩn cấp & Quan trọng</span>
        </div>
      `;
    }).join('');
  }

  const membersSummaryContainer = document.getElementById('dashboard-members-summary');
  if (members.length === 0) {
    membersSummaryContainer.innerHTML = '<p class="text-muted" style="font-size:0.9rem;">Chưa có thành viên nào. Hãy qua mục "Thành viên" để tạo.</p>';
  } else {
    membersSummaryContainer.innerHTML = members.map(m => {
      const activeProjNames = projects
        .filter(p => p.members.includes(m.id))
        .map(p => p.name);
      const projsStr = activeProjNames.length > 0 ? activeProjNames.join(', ') : 'Chưa tham gia dự án nào';

      return `
        <div class="project-quick-card">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div class="avatar" style="background-color:${m.color};margin:0;">${m.name.charAt(0).toUpperCase()}</div>
            <div>
              <div class="project-name">${escapeHTML(m.name)}</div>
              <div class="project-tasks-count" style="max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHTML(projsStr)}">
                Dự án: ${escapeHTML(projsStr)}
              </div>
            </div>
          </div>
          <span class="project-tasks-count" style="font-weight:600;">${activeProjNames.length} dự án</span>
        </div>
      `;
    }).join('');
  }
}

// 2. Render Projects (Danh sách dự án)
function renderProjects() {
  const container = document.getElementById('projects-container');
  const countText = document.getElementById('project-count-text');
  
  // Đồng bộ chọn danh sách lọc phòng ban ở header
  const filterDeptSelect = document.getElementById('filter-project-dept');
  filterDeptSelect.innerHTML = '<option value="">Tất cả</option>' + 
    DEFAULT_DEPARTMENTS.map(d => `<option value="${d}" ${filterDept === d ? 'selected' : ''}>${d}</option>`).join('');

  // Lọc dự án theo phòng ban
  let projects = State.projects;
  if (filterDept) {
    projects = projects.filter(p => p.department === filterDept);
  }

  countText.textContent = `Hiển thị ${projects.length} dự án. Bạn có thể kéo thả để sắp xếp thứ tự các dự án.`;

  if (projects.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background-color: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <p class="text-muted" style="margin-bottom: 1rem;">Không có dự án nào thỏa mãn bộ lọc.</p>
        <button class="btn btn-primary" onclick="window.app.openProjectModal()">Tạo dự án mới</button>
      </div>
    `;
    return;
  }

  container.innerHTML = projects.map((p, index) => {
    const memberAvatars = p.members.map(mId => {
      const m = State.members.find(mem => mem.id === mId);
      if (!m) return '';
      return `<div class="avatar" style="background-color:${m.color};" title="${escapeHTML(m.name)} - ${escapeHTML(m.role)}">${m.name.charAt(0).toUpperCase()}</div>`;
    }).join('');

    const quadrantText = getQuadrantName(p.quadrant);
    const totalTasks = p.tasks.length;
    const completedCount = p.tasks.filter(t => t.status === 'done').length;

    // Render nhãn thẻ của dự án
    const tagsHtml = (p.tags || []).map(tId => {
      const t = State.tags.find(tag => tag.id === tId);
      if (!t) return '';
      return `<span class="tag-badge" style="background-color:${t.color}; font-size:0.65rem; margin-right:0.25rem;">${escapeHTML(t.name)}</span>`;
    }).join('');

    return `
      <div class="project-card draggable" 
           data-drag-type="project-list" 
           data-id="${p.id}" 
           data-quadrant="${p.quadrant}"
           style="cursor: grab;"
           onclick="window.app.openProject('${p.id}', event)">
        
        <div class="project-card-header">
          <h3 class="project-card-title">${escapeHTML(p.name)}</h3>
          <div class="drag-handle" style="padding:0.25rem;" onclick="event.stopPropagation()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
              <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
              <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
            </svg>
          </div>
        </div>

        <p class="project-card-desc">${escapeHTML(p.description || 'Không có mô tả.')}</p>

        <!-- Nhãn thẻ dự án -->
        ${tagsHtml ? `<div style="display:flex; flex-wrap:wrap; gap:0.25rem;">${tagsHtml}</div>` : ''}

        <div style="font-size: 0.8rem; color: var(--text-muted); display:flex; justify-content:space-between; align-items:center;">
          <span>Tiến độ công việc:</span>
          <strong>${completedCount}/${totalTasks}</strong>
        </div>

        <div class="project-card-meta">
          <span class="project-quadrant-badge">${quadrantText}</span>
          <div class="avatar-group">
            ${memberAvatars}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 3. Render Project Detail (Chi tiết dự án)
function renderProjectDetail() {
  if (!selectedProjectId) {
    switchView('projects');
    return;
  }

  const project = State.projects.find(p => p.id === selectedProjectId);
  if (!project) {
    switchView('projects');
    return;
  }

  document.getElementById('breadcrumb-current-project').textContent = project.name;
  document.getElementById('detail-project-name').textContent = project.name;
  document.getElementById('detail-project-desc').textContent = project.description || 'Không có mô tả dự án.';

  // Phòng ban
  const deptWrapper = document.getElementById('detail-project-dept-wrapper');
  if (project.department) {
    deptWrapper.style.display = 'inline-flex';
    document.getElementById('detail-project-dept').textContent = project.department;
  } else {
    deptWrapper.style.display = 'none';
  }

  // Góc ma trận
  const badgeQuad = document.getElementById('detail-project-quadrant');
  badgeQuad.textContent = getQuadrantName(project.quadrant);
  badgeQuad.className = 'project-quadrant-badge';
  badgeQuad.style.color = `var(--q${project.quadrant}-color)`;
  badgeQuad.style.backgroundColor = `var(--q${project.quadrant}-bg)`;

  // Nhãn thẻ của dự án
  const tagsContainer = document.getElementById('detail-project-tags');
  if (!project.tags || project.tags.length === 0) {
    tagsContainer.innerHTML = '<span class="text-muted" style="font-size:0.8rem;">Trống</span>';
  } else {
    tagsContainer.innerHTML = project.tags.map(tId => {
      const t = State.tags.find(tag => tag.id === tId);
      if (!t) return '';
      return `<span class="tag-badge" style="background-color:${t.color};">${escapeHTML(t.name)}</span>`;
    }).join('');
  }

  // Nhóm phụ trách dự án
  const avatarsContainer = document.getElementById('detail-project-members-avatars');
  if (project.members.length === 0) {
    avatarsContainer.innerHTML = '<span class="text-muted" style="font-size:0.85rem;">Chưa gán thành viên</span>';
  } else {
    avatarsContainer.innerHTML = project.members.map(mId => {
      const m = State.members.find(mem => mem.id === mId);
      if (!m) return '';
      return `<div class="avatar" style="background-color:${m.color};" title="${escapeHTML(m.name)} - ${escapeHTML(m.role)}">${m.name.charAt(0).toUpperCase()}</div>`;
    }).join('');
  }

  // Đồng bộ cấu hình cột Kanban ẩn/hiện
  const visibleCols = project.visibleColumns || ['todo', 'in-progress', 'done'];
  const colToggles = document.querySelectorAll('.column-visibility-toggle');
  colToggles.forEach(toggle => {
    toggle.checked = visibleCols.includes(toggle.value);
  });

  // Ẩn/Hiện cột Kanban bằng css display
  const colTodo = document.getElementById('kanban-col-todo');
  const colInProgress = document.getElementById('kanban-col-in-progress');
  const colDone = document.getElementById('kanban-col-done');
  
  colTodo.style.display = visibleCols.includes('todo') ? 'flex' : 'none';
  colInProgress.style.display = visibleCols.includes('in-progress') ? 'flex' : 'none';
  colDone.style.display = visibleCols.includes('done') ? 'flex' : 'none';

  // Điều chỉnh tỷ lệ grid của bảng Kanban theo số cột đang hiển thị
  const kanbanBoard = document.getElementById('project-detail-kanban');
  kanbanBoard.style.gridTemplateColumns = `repeat(${visibleCols.length}, 1fr)`;

  // Render các Task dựa vào Tab và Bộ lọc đang hoạt động
  if (projectDetailTab === 'kanban') {
    renderKanbanTab(project, visibleCols);
  } else {
    renderListTab(project);
  }
}

function renderKanbanTab(project, visibleCols) {
  const todoCol = document.getElementById('column-todo');
  const inProgressCol = document.getElementById('column-inprogress');
  const doneCol = document.getElementById('column-done');

  // Lọc nhiệm vụ theo bộ lọc trạng thái và cột hiển thị
  let filteredTasks = getFilteredTasks(project.tasks);

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  // Cập nhật số lượng của từng cột
  document.getElementById('badge-todo-count').textContent = todoTasks.length;
  document.getElementById('badge-inprogress-count').textContent = inProgressTasks.length;
  document.getElementById('badge-done-count').textContent = doneTasks.length;

  const renderTaskCard = (t) => {
    const avatars = (t.assignedTo || []).map(mId => {
      const m = State.members.find(mem => mem.id === mId);
      if (!m) return '';
      return `<div class="avatar" style="width:22px;height:22px;font-size:0.65rem;background-color:${m.color};" title="${escapeHTML(m.name)}">${m.name.charAt(0).toUpperCase()}</div>`;
    }).join('');

    const taskTagsHtml = (t.tags || []).map(tId => {
      const tagObj = State.tags.find(tag => tag.id === tId);
      if (!tagObj) return '';
      return `<span class="tag-badge" style="background-color:${tagObj.color}; font-size:0.6rem; padding:0.08rem 0.35rem; margin-top:0.25rem; margin-right:0.2rem;">${escapeHTML(tagObj.name)}</span>`;
    }).join('');

    return `
      <div class="task-card draggable" 
           data-drag-type="task-kanban" 
           data-id="${t.id}" 
           data-parent-id="${project.id}" 
           data-status="${t.status}"
           onclick="window.app.openTaskModal('${t.id}', '${project.id}', event)">
        <h4 class="task-card-title">${escapeHTML(t.name)}</h4>
        ${t.description ? `<p class="task-card-desc">${escapeHTML(t.description)}</p>` : ''}
        
        <!-- Nhãn thẻ của Task -->
        ${taskTagsHtml ? `<div style="display:flex; flex-wrap:wrap; gap:0.2rem; align-items:center;">${taskTagsHtml}</div>` : ''}

        <div class="task-card-footer">
          <div class="avatar-group">
            ${avatars}
          </div>
          <div class="task-card-actions">
            <button type="button" class="btn-task-delete" title="Xóa" onclick="window.app.deleteTask('${project.id}', '${t.id}', event)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  };

  todoCol.innerHTML = todoTasks.length > 0 ? todoTasks.map(renderTaskCard).join('') : '<p class="text-muted" style="text-align:center;padding:1.5rem 0;font-size:0.8rem;">Trống</p>';
  inProgressCol.innerHTML = inProgressTasks.length > 0 ? inProgressTasks.map(renderTaskCard).join('') : '<p class="text-muted" style="text-align:center;padding:1.5rem 0;font-size:0.8rem;">Trống</p>';
  doneCol.innerHTML = doneTasks.length > 0 ? doneTasks.map(renderTaskCard).join('') : '<p class="text-muted" style="text-align:center;padding:1.5rem 0;font-size:0.8rem;">Trống</p>';
}

function renderListTab(project) {
  const container = document.getElementById('task-list-rows-container');

  // Lọc nhiệm vụ
  const filteredTasks = getFilteredTasks(project.tasks);

  if (filteredTasks.length === 0) {
    container.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem 0;font-size:0.9rem;">Không có công việc nào thỏa mãn bộ lọc.</p>';
    return;
  }

  container.innerHTML = filteredTasks.map((t, index) => {
    const avatars = (t.assignedTo || []).map(mId => {
      const m = State.members.find(mem => mem.id === mId);
      if (!m) return '';
      return `<div class="avatar" style="width:24px;height:24px;font-size:0.7rem;background-color:${m.color};" title="${escapeHTML(m.name)}">${m.name.charAt(0).toUpperCase()}</div>`;
    }).join('');

    const taskTagsHtml = (t.tags || []).map(tId => {
      const tagObj = State.tags.find(tag => tag.id === tId);
      if (!tagObj) return '';
      return `<span class="tag-badge" style="background-color:${tagObj.color}; font-size:0.65rem; padding:0.1rem 0.4rem; margin-right:0.25rem;">${escapeHTML(tagObj.name)}</span>`;
    }).join('');

    const statusLabel = t.status === 'todo' ? 'Chưa thực hiện' : t.status === 'in-progress' ? 'Đang làm' : 'Hoàn thành';

    return `
      <div class="task-list-row draggable" 
           data-drag-type="task-list" 
           data-id="${t.id}" 
           data-parent-id="${project.id}"
           onclick="window.app.openTaskModal('${t.id}', '${project.id}', event)">
        
        <div class="drag-handle" title="Kéo sắp xếp" style="padding: 0.25rem;" onclick="event.stopPropagation()">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
            <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
            <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
          </svg>
        </div>

        <div class="task-row-status-badge" data-status="${t.status}">${statusLabel}</div>
        
        <div class="task-row-name">${escapeHTML(t.name)}</div>
        
        <!-- Nhãn thẻ task dòng -->
        ${taskTagsHtml ? `<div style="display:flex; flex-wrap:wrap; gap:0.2rem; align-items:center; max-width:200px;">${taskTagsHtml}</div>` : ''}

        <div class="task-row-desc">${escapeHTML(t.description || '')}</div>
        
        <div class="task-row-meta">
          <div class="avatar-group">
            ${avatars}
          </div>
          <div class="task-card-actions">
            <button type="button" class="btn-task-delete" title="Xóa" onclick="window.app.deleteTask('${project.id}', '${t.id}', event)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

      </div>
    `;
  }).join('');
}

// 4. Render Ma trận Eisenhower
function renderMatrix() {
  const projects = State.projects;

  for (let q = 1; q <= 4; q++) {
    const quadrantContainer = document.getElementById(`quadrant-${q}-container`);
    const quadrantProjects = projects.filter(p => p.quadrant === q);

    if (quadrantProjects.length === 0) {
      quadrantContainer.innerHTML = '<p class="text-muted" style="text-align:center;padding:1.5rem;font-size:0.8rem;border:1px dashed var(--border-color);border-radius:var(--radius-sm);">Trống (Kéo dự án vào đây)</p>';
    } else {
      quadrantContainer.innerHTML = quadrantProjects.map(p => {
        const total = p.tasks.length;
        const done = p.tasks.filter(t => t.status === 'done').length;

        return `
          <div class="matrix-project-item draggable" 
               data-drag-type="project-matrix" 
               data-id="${p.id}" 
               data-quadrant="${p.quadrant}"
               onclick="window.app.openProject('${p.id}', event)">
            
            <div class="matrix-project-info">
              <div class="matrix-project-name">${escapeHTML(p.name)}</div>
              <div class="matrix-project-meta">${done}/${total} task hoàn thành</div>
            </div>
            
            <div class="drag-handle" title="Kéo để đổi nhóm Ma trận" onclick="event.stopPropagation()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;">
                <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
                <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
              </svg>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

// 5. Render View Quản lý thẻ (Tags)
function renderTagsView() {
  const container = document.getElementById('tags-management-container');
  const tags = State.tags;

  if (tags.length === 0) {
    container.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem;border:1px dashed var(--border-color);border-radius:var(--radius-sm);">Chưa có nhãn thẻ nào. Sử dụng mẫu bên trái để tạo.</p>';
    return;
  }

  container.innerHTML = tags.map(t => {
    // Đếm số lượng task và dự án liên kết với tag này
    let linkedProjCount = State.projects.filter(p => (p.tags || []).includes(t.id)).length;
    let linkedTaskCount = 0;
    State.projects.forEach(p => {
      linkedTaskCount += p.tasks.filter(task => (task.tags || []).includes(t.id)).length;
    });

    return `
      <div class="tag-list-item">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span class="tag-badge" style="background-color:${t.color}; padding:0.3rem 0.8rem; font-size:0.85rem;">${escapeHTML(t.name)}</span>
          <span class="text-muted" style="font-size:0.8rem;">(Dùng cho ${linkedProjCount} dự án, ${linkedTaskCount} công việc)</span>
        </div>
        
        <div style="display:flex; gap:0.5rem;">
          <button type="button" title="Sửa" onclick="window.app.editTagDirect('${t.id}', event)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </button>
          <button type="button" class="btn-member-delete" title="Xóa thẻ" onclick="window.app.deleteTagDirect('${t.id}', event)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 6. Render Thành viên
function renderMembers() {
  const container = document.getElementById('members-grid-container');
  const members = State.members;

  if (members.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background-color: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <p class="text-muted" style="margin-bottom: 1rem;">Chưa có nhân sự nào trong đội ngũ.</p>
        <button class="btn btn-primary" onclick="window.app.openMemberModal()">Thêm thành viên</button>
      </div>
    `;
    return;
  }

  container.innerHTML = members.map(m => {
    const projsCount = State.projects.filter(p => p.members.includes(m.id)).length;

    return `
      <div class="member-card">
        <div class="member-card-left">
          <div class="member-avatar" style="background-color:${m.color};">${m.name.charAt(0).toUpperCase()}</div>
          <div class="member-card-info">
            <h4>${escapeHTML(m.name)}</h4>
            <p>${escapeHTML(m.role)}</p>
          </div>
        </div>
        
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem;">
          <span class="project-tasks-count" style="font-size:0.8rem;font-weight:600;">${projsCount} dự án</span>
          <div class="member-card-actions">
            <button type="button" title="Sửa" onclick="window.app.openMemberModal('${m.id}', event)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
            </button>
            <button type="button" class="btn-member-delete" title="Xóa nhân sự" onclick="window.app.deleteMember('${m.id}', event)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}


// ----------------------------------------------------
// ĐIỀU KHIỂN CÁC MODAL HỘP THOẠI (Modals Control)
// ----------------------------------------------------

// --- 1. MODAL DỰ ÁN ---
function openProjectModal(projectId = null) {
  const form = document.getElementById('form-project');
  form.reset();

  const titleEl = document.getElementById('modal-project-title');
  const btnDelete = document.getElementById('btn-delete-project');
  const idInput = document.getElementById('project-form-id');
  
  // Render phòng ban selection
  const deptSelect = document.getElementById('project-form-dept');
  deptSelect.innerHTML = '<option value="">Không phân loại</option>' + 
    DEFAULT_DEPARTMENTS.map(d => `<option value="${d}">${d}</option>`).join('');

  // Render danh sách checkbox nhãn thẻ
  const tagsListContainer = document.getElementById('project-form-tags-list');
  if (State.tags.length === 0) {
    tagsListContainer.innerHTML = '<p class="text-muted" style="font-size:0.85rem;padding:0.5rem 0;">Chưa có nhãn thẻ nào. Thêm ở trang "Quản lý thẻ".</p>';
  } else {
    tagsListContainer.innerHTML = State.tags.map(t => `
      <label class="member-checkbox-item">
        <input type="checkbox" name="project-tags" value="${t.id}">
        <span class="tag-badge" style="background-color:${t.color}; font-size:0.75rem; margin:0;">${escapeHTML(t.name)}</span>
      </label>
    `).join('');
  }

  // Render danh sách checkbox thành viên toàn cục
  const membersListContainer = document.getElementById('project-form-members-list');
  if (State.members.length === 0) {
    membersListContainer.innerHTML = '<p class="text-muted" style="font-size:0.85rem;padding:0.5rem 0;">Chưa có thành viên nào. Hãy thêm thành viên trước.</p>';
  } else {
    membersListContainer.innerHTML = State.members.map(m => `
      <label class="member-checkbox-item">
        <input type="checkbox" name="project-members" value="${m.id}">
        <span class="avatar" style="width:20px;height:20px;font-size:0.6rem;background-color:${m.color};margin:0;">${m.name.charAt(0).toUpperCase()}</span>
        <span style="font-size:0.9rem;">${escapeHTML(m.name)} (${escapeHTML(m.role)})</span>
      </label>
    `).join('');
  }

  if (projectId) {
    const project = State.projects.find(p => p.id === projectId);
    if (!project) return;

    titleEl.textContent = 'Cập nhật Dự án';
    idInput.value = project.id;
    document.getElementById('project-form-name').value = project.name;
    document.getElementById('project-form-desc').value = project.description || '';
    document.getElementById('project-form-quadrant').value = project.quadrant;
    document.getElementById('project-form-dept').value = project.department || '';
    
    // Check nhãn thẻ của dự án
    const tagCBs = document.querySelectorAll('input[name="project-tags"]');
    tagCBs.forEach(cb => {
      if ((project.tags || []).includes(cb.value)) {
        cb.checked = true;
      }
    });

    // Check thành viên của dự án
    const cbMembers = document.querySelectorAll('input[name="project-members"]');
    cbMembers.forEach(cb => {
      if (project.members.includes(cb.value)) {
        cb.checked = true;
      }
    });

    btnDelete.style.display = 'inline-flex';
  } else {
    titleEl.textContent = 'Tạo Dự án Mới';
    idInput.value = '';
    btnDelete.style.display = 'none';
  }

  DOM.modalProject.classList.add('active');
}

function closeProjectModal() {
  DOM.modalProject.classList.remove('active');
}

function saveProjectForm() {
  const id = document.getElementById('project-form-id').value;
  const name = document.getElementById('project-form-name').value.trim();
  const description = document.getElementById('project-form-desc').value.trim();
  const quadrant = parseInt(document.getElementById('project-form-quadrant').value);
  const department = document.getElementById('project-form-dept').value;

  if (!name) {
    alert('Vui lòng nhập tên dự án!');
    return;
  }

  // Lấy tagIds được chọn
  const tagIds = [];
  const checkedTags = document.querySelectorAll('input[name="project-tags"]:checked');
  checkedTags.forEach(cb => tagIds.push(cb.value));

  // Lấy memberIds được chọn
  const memberIds = [];
  const checkedMembers = document.querySelectorAll('input[name="project-members"]:checked');
  checkedMembers.forEach(cb => memberIds.push(cb.value));

  if (id) {
    State.updateProject(id, { name, description, quadrant, department, tags: tagIds, members: memberIds });
  } else {
    State.addProject(name, description, quadrant, memberIds, department, tagIds);
  }

  closeProjectModal();
  
  if (currentView === 'project-detail' && id === selectedProjectId) {
    renderProjectDetail();
  } else if (currentView === 'dashboard') {
    renderDashboard();
  } else if (currentView === 'matrix') {
    renderMatrix();
  } else {
    renderProjects();
  }
}

function deleteProjectFromForm() {
  const id = document.getElementById('project-form-id').value;
  if (!id) return;

  if (confirm('Bạn có chắc chắn muốn xóa dự án này? Toàn bộ các công việc bên trong dự án cũng sẽ bị xóa.')) {
    State.deleteProject(id);
    closeProjectModal();
    if (selectedProjectId === id) {
      selectedProjectId = null;
    }
    switchView('projects');
  }
}


// --- 2. MODAL CÔNG VIỆC (TASKS) ---
function openTaskModal(taskId = null, projectId, event = null) {
  if (event) event.stopPropagation();

  const form = document.getElementById('form-task');
  form.reset();

  const titleEl = document.getElementById('modal-task-title');
  const idInput = document.getElementById('task-form-id');
  const projectIdInput = document.getElementById('task-form-project-id');
  
  projectIdInput.value = projectId;
  const project = State.projects.find(p => p.id === projectId);
  if (!project) return;

  // Render danh sách checkbox nhãn thẻ
  const tagsListContainer = document.getElementById('task-form-tags-list');
  if (State.tags.length === 0) {
    tagsListContainer.innerHTML = '<p class="text-muted" style="font-size:0.85rem;padding:0.5rem 0;">Chưa có nhãn thẻ nào. Thêm ở trang "Quản lý thẻ".</p>';
  } else {
    tagsListContainer.innerHTML = State.tags.map(t => `
      <label class="member-checkbox-item">
        <input type="checkbox" name="task-tags" value="${t.id}">
        <span class="tag-badge" style="background-color:${t.color}; font-size:0.75rem; margin:0;">${escapeHTML(t.name)}</span>
      </label>
    `).join('');
  }

  // Lọc chỉ những thành viên đã gán cho dự án này
  const projectMembers = State.members.filter(m => project.members.includes(m.id));
  const membersListContainer = document.getElementById('task-form-members-list');

  if (projectMembers.length === 0) {
    membersListContainer.innerHTML = '<p class="text-muted" style="font-size:0.85rem;padding:0.5rem 0;">Dự án này chưa được gán thành viên. Bạn hãy cập nhật nhân sự của dự án trước.</p>';
  } else {
    membersListContainer.innerHTML = projectMembers.map(m => `
      <label class="member-checkbox-item">
        <input type="checkbox" name="task-members" value="${m.id}">
        <span class="avatar" style="width:20px;height:20px;font-size:0.6rem;background-color:${m.color};margin:0;">${m.name.charAt(0).toUpperCase()}</span>
        <span style="font-size:0.9rem;">${escapeHTML(m.name)}</span>
      </label>
    `).join('');
  }

  if (taskId) {
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;

    titleEl.textContent = 'Cập nhật Công việc';
    idInput.value = task.id;
    document.getElementById('task-form-name').value = task.name;
    document.getElementById('task-form-desc').value = task.description || '';
    document.getElementById('task-form-status').value = task.status;

    // Check nhãn thẻ của task
    const tagCBs = document.querySelectorAll('input[name="task-tags"]');
    tagCBs.forEach(cb => {
      if ((task.tags || []).includes(cb.value)) {
        cb.checked = true;
      }
    });

    // Check thành viên của task
    const checkboxes = document.querySelectorAll('input[name="task-members"]');
    checkboxes.forEach(cb => {
      if ((task.assignedTo || []).includes(cb.value)) {
        cb.checked = true;
      }
    });
  } else {
    titleEl.textContent = 'Thêm Công việc Mới';
    idInput.value = '';
  }

  DOM.modalTask.classList.add('active');
}

function closeTaskModal() {
  DOM.modalTask.classList.remove('active');
}

function saveTaskForm() {
  const taskId = document.getElementById('task-form-id').value;
  const projectId = document.getElementById('task-form-project-id').value;
  const name = document.getElementById('task-form-name').value.trim();
  const description = document.getElementById('task-form-desc').value.trim();
  const status = document.getElementById('task-form-status').value;

  if (!name) {
    alert('Vui lòng nhập tên công việc!');
    return;
  }

  // Lấy tagIds
  const tagIds = [];
  const checkedTags = document.querySelectorAll('input[name="task-tags"]:checked');
  checkedTags.forEach(cb => tagIds.push(cb.value));

  // Lấy memberIds
  const assignedTo = [];
  const checkedBoxes = document.querySelectorAll('input[name="task-members"]:checked');
  checkedBoxes.forEach(cb => assignedTo.push(cb.value));

  if (taskId) {
    State.updateTask(projectId, taskId, { name, description, status, assignedTo, tags: tagIds });
  } else {
    State.addTask(projectId, name, description, status, assignedTo, tagIds);
  }

  closeTaskModal();
  renderProjectDetail();
}

function deleteTask(projectId, taskId, event) {
  if (event) event.stopPropagation();

  if (confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
    State.deleteTask(projectId, taskId);
    renderProjectDetail();
  }
}


// --- 3. MODAL THÀNH VIÊN ---
function openMemberModal(memberId = null, event = null) {
  if (event) event.stopPropagation();

  const form = document.getElementById('form-member');
  form.reset();

  const titleEl = document.getElementById('modal-member-title');
  const idInput = document.getElementById('member-form-id');
  const colorOptions = document.querySelectorAll('#member-form-color-picker .color-option');

  if (memberId) {
    const m = State.members.find(mem => mem.id === memberId);
    if (!m) return;

    titleEl.textContent = 'Cập nhật Nhân sự';
    idInput.value = m.id;
    document.getElementById('member-form-name').value = m.name;
    document.getElementById('member-form-role').value = m.role;

    colorOptions.forEach(opt => {
      if (opt.getAttribute('data-color') === m.color) {
        opt.classList.add('selected');
      } else {
        opt.classList.remove('selected');
      }
    });
  } else {
    titleEl.textContent = 'Thêm Thành viên Mới';
    idInput.value = '';
    
    colorOptions.forEach((opt, idx) => {
      if (idx === 0) opt.classList.add('selected');
      else opt.classList.remove('selected');
    });
  }

  DOM.modalMember.classList.add('active');
}

function closeMemberModal() {
  DOM.modalMember.classList.remove('active');
}

function saveMemberForm() {
  const id = document.getElementById('member-form-id').value;
  const name = document.getElementById('member-form-name').value.trim();
  const role = document.getElementById('member-form-role').value.trim();
  const selectedColorEl = document.querySelector('#member-form-color-picker .color-option.selected');
  const color = selectedColorEl ? selectedColorEl.getAttribute('data-color') : '#ef4444';

  if (!name) {
    alert('Vui lòng nhập họ và tên!');
    return;
  }

  if (id) {
    State.updateMember(id, { name, role, color });
  } else {
    State.addMember(name, role, color);
  }

  closeMemberModal();
  renderMembers();
}

function deleteMember(memberId, event) {
  if (event) event.stopPropagation();

  if (confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi hệ thống? Họ cũng sẽ bị hủy phân công khỏi các dự án và công việc đang tham gia.')) {
    State.deleteMember(memberId);
    renderMembers();
  }
}


// --- 4. FORM QUẢN LÝ NHÃN THẺ TRỰC TIẾP (Tags Control) ---
function saveTagDirectForm() {
  const id = document.getElementById('tag-direct-id').value;
  const name = document.getElementById('tag-direct-name').value.trim();
  const selectedColorEl = document.querySelector('#tag-direct-color-picker .color-option.selected');
  const color = selectedColorEl ? selectedColorEl.getAttribute('data-color') : '#ef4444';

  if (!name) {
    alert('Vui lòng nhập tên nhãn thẻ!');
    return;
  }

  if (id) {
    State.updateTag(id, name, color);
  } else {
    State.addTag(name, color);
  }

  resetTagDirectForm();
  renderTagsView();
}

function editTagDirect(tagId, event) {
  if (event) event.stopPropagation();
  const tag = State.tags.find(t => t.id === tagId);
  if (!tag) return;

  document.getElementById('tag-direct-form-title').textContent = 'Cập nhật nhãn thẻ';
  document.getElementById('tag-direct-id').value = tag.id;
  document.getElementById('tag-direct-name').value = tag.name;
  document.getElementById('btn-cancel-tag-direct').style.display = 'inline-flex';

  const colorOptions = document.querySelectorAll('#tag-direct-color-picker .color-option');
  colorOptions.forEach(opt => {
    if (opt.getAttribute('data-color') === tag.color) {
      opt.classList.add('selected');
    } else {
      opt.classList.remove('selected');
    }
  });
}

function deleteTagDirect(tagId, event) {
  if (event) event.stopPropagation();
  if (confirm('Bạn có chắc chắn muốn xóa nhãn thẻ này? Nhãn thẻ sẽ bị gỡ bỏ khỏi tất cả dự án và nhiệm vụ liên quan.')) {
    State.deleteTag(tagId);
    resetTagDirectForm();
    renderTagsView();
  }
}

function resetTagDirectForm() {
  document.getElementById('form-tag-direct').reset();
  document.getElementById('tag-direct-form-title').textContent = 'Tạo nhãn thẻ mới';
  document.getElementById('tag-direct-id').value = '';
  document.getElementById('btn-cancel-tag-direct').style.display = 'none';

  const colorOptions = document.querySelectorAll('#tag-direct-color-picker .color-option');
  colorOptions.forEach((opt, idx) => {
    if (idx === 0) opt.classList.add('selected');
    else opt.classList.remove('selected');
  });
}


// --- CÁC HÀM TIỆN ÍCH ---

function openProject(projectId, event = null) {
  if (event) {
    if (event.target.closest('.drag-handle') || event.target.closest('button')) {
      return;
    }
  }
  // Reset bộ lọc công việc khi chuyển vào dự án mới
  filterTaskStatus = 'all';
  const filterSelect = document.getElementById('filter-task-status');
  if (filterSelect) filterSelect.value = 'all';

  switchView('project-detail', projectId);
}

function getQuadrantName(q) {
  switch (q) {
    case 1: return 'Khẩn cấp & Quan trọng';
    case 2: return 'Quan trọng - Không khẩn cấp';
    case 3: return 'Khẩn cấp - Không quan trọng';
    case 4: return 'Không khẩn cấp & Không quan trọng';
    default: return '';
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Xuất các hàm ra ngoài window để click gọi được từ DOM HTML
window.app = {
  openProject,
  openProjectModal,
  openTaskModal,
  deleteTask,
  openMemberModal,
  deleteMember,
  editTagDirect,
  deleteTagDirect
};
