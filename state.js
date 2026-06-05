// state.js
// Quản lý trạng thái và lưu trữ dữ liệu trong localStorage

const STORAGE_KEY = 'quan_ly_cong_viec_data';

const DEFAULT_MEMBERS = [
  { id: 'm1', name: 'Nguyễn Văn A', role: 'Quản lý dự án', color: '#ef4444' }, // Đỏ
  { id: 'm2', name: 'Trần Thị B', role: 'Lập trình viên', color: '#3b82f6' }, // Xanh dương
  { id: 'm3', name: 'Lê Văn C', role: 'Nhà thiết kế', color: '#10b981' }, // Xanh lá
  { id: 'm4', name: 'Phạm Minh D', role: 'Kiểm thử viên', color: '#f59e0b' }  // Vàng
];

const DEFAULT_PROJECTS = [
  {
    id: 'p1',
    name: 'Xây dựng Website bán hàng',
    description: 'Dự án thương mại điện tử tích hợp thanh toán trực tuyến.',
    quadrant: 1, // 1: Khẩn cấp & Quan trọng, 2: Quan trọng - Không khẩn cấp, 3: Khẩn cấp - Không quan trọng, 4: Không khẩn cấp - Không quan trọng
    members: ['m1', 'm2', 'm3', 'm4'],
    tasks: [
      { id: 't1', name: 'Thiết kế giao diện Trang chủ', description: 'Thiết kế bản vẽ giao diện sáng/tối trên Figma và xuất tài nguyên.', status: 'done', assignedTo: ['m3'] },
      { id: 't2', name: 'Lập trình API giỏ hàng', description: 'Xây dựng cơ sở dữ liệu giỏ hàng và các API thêm/sửa/xóa sản phẩm.', status: 'in-progress', assignedTo: ['m2'] },
      { id: 't3', name: 'Tích hợp cổng thanh toán MoMo', description: 'Kết nối API môi trường Sandbox MoMo để kiểm thử.', status: 'todo', assignedTo: ['m2', 'm1'] },
      { id: 't4', name: 'Viết tài liệu hướng dẫn sử dụng', description: 'Tài liệu chi tiết hướng dẫn thao tác admin và người dùng.', status: 'todo', assignedTo: ['m4'] }
    ]
  },
  {
    id: 'p2',
    name: 'Chiến dịch Marketing sản phẩm mới',
    description: 'Lên kế hoạch quảng bá sản phẩm ứng dụng quản trị doanh nghiệp.',
    quadrant: 2, // Quan trọng nhưng không khẩn cấp
    members: ['m1', 'm3'],
    tasks: [
      { id: 't5', name: 'Lập ngân sách quảng cáo', description: 'Tính toán chi phí chạy quảng cáo Facebook, Google và báo cáo sếp.', status: 'done', assignedTo: ['m1'] },
      { id: 't6', name: 'Viết bài giới thiệu sản phẩm', description: 'Chuẩn bị nội dung bài viết PR trên các kênh truyền thông chính.', status: 'in-progress', assignedTo: ['m1'] },
      { id: 't7', name: 'Thiết kế banner quảng cáo', description: 'Tạo các ấn phẩm đồ họa cho bài viết PR mạng xã hội.', status: 'todo', assignedTo: ['m3'] }
    ]
  },
  {
    id: 'p3',
    name: 'Trả lời email của đối tác',
    description: 'Giải quyết các thắc mắc về hợp đồng dịch vụ kỹ thuật.',
    quadrant: 3, // Khẩn cấp nhưng không quan trọng
    members: ['m1'],
    tasks: [
      { id: 't8', name: 'Phản hồi email anh Nam (VNG)', description: 'Xác nhận thời gian họp bàn về tiến độ tích hợp hệ thống.', status: 'todo', assignedTo: ['m1'] }
    ]
  },
  {
    id: 'p4',
    name: 'Dọn dẹp tài liệu cũ trên Google Drive',
    description: 'Giải phóng dung lượng lưu trữ đám mây cho công ty.',
    quadrant: 4, // Không khẩn cấp và không quan trọng
    members: ['m1', 'm4'],
    tasks: [
      { id: 't9', name: 'Lọc các tệp tin lưu tạm', description: 'Xóa hoặc lưu trữ cục bộ các tệp tin tạm không sử dụng từ năm 2024.', status: 'done', assignedTo: ['m4'] }
    ]
  }
];

export const State = {
  projects: [],
  members: [],
  theme: 'light',

  // Khởi tạo trạng thái
  init() {
    this.load();
    if (this.projects.length === 0 && this.members.length === 0) {
      this.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
      this.members = JSON.parse(JSON.stringify(DEFAULT_MEMBERS));
      this.theme = 'light';
      this.save();
    }
  },

  // Đọc dữ liệu từ localStorage
  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.projects = parsed.projects || [];
        this.members = parsed.members || [];
        this.theme = parsed.theme || 'light';
      }
    } catch (e) {
      console.error('Không thể đọc dữ liệu từ localStorage', e);
    }
  },

  // Lưu dữ liệu vào localStorage
  save() {
    try {
      const data = {
        projects: this.projects,
        members: this.members,
        theme: this.theme
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Không thể lưu dữ liệu vào localStorage', e);
    }
  },

  // --- Quản lý Dự án ---
  addProject(name, description, quadrant, memberIds = []) {
    const id = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const newProject = {
      id,
      name,
      description,
      quadrant: parseInt(quadrant) || 1,
      members: memberIds,
      tasks: []
    };
    this.projects.push(newProject);
    this.save();
    return newProject;
  },

  updateProject(id, updates) {
    const project = this.projects.find(p => p.id === id);
    if (project) {
      Object.assign(project, updates);
      this.save();
      return project;
    }
    return null;
  },

  deleteProject(id) {
    const index = this.projects.findIndex(p => p.id === id);
    if (index !== -1) {
      this.projects.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  },

  reorderProjects(fromIndex, toIndex) {
    if (fromIndex >= 0 && fromIndex < this.projects.length && toIndex >= 0 && toIndex < this.projects.length) {
      const [removed] = this.projects.splice(fromIndex, 1);
      this.projects.splice(toIndex, 0, removed);
      this.save();
    }
  },

  // --- Quản lý Thành viên ---
  addMember(name, role, color) {
    const id = 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const newMember = {
      id,
      name,
      role: role || 'Thành viên',
      color: color || '#3b82f6'
    };
    this.members.push(newMember);
    this.save();
    return newMember;
  },

  updateMember(id, updates) {
    const member = this.members.find(m => m.id === id);
    if (member) {
      Object.assign(member, updates);
      this.save();
      return member;
    }
    return null;
  },

  deleteMember(id) {
    const index = this.members.findIndex(m => m.id === id);
    if (index !== -1) {
      this.members.splice(index, 1);
      
      // Xóa liên kết thành viên trong các dự án
      this.projects.forEach(project => {
        project.members = project.members.filter(mId => mId !== id);
        // Xóa liên kết thành viên trong các công việc
        project.tasks.forEach(task => {
          if (task.assignedTo) {
            task.assignedTo = task.assignedTo.filter(mId => mId !== id);
          }
        });
      });

      this.save();
      return true;
    }
    return false;
  },

  // --- Quản lý Công việc (Tasks) ---
  addTask(projectId, name, description, status = 'todo', assignedTo = []) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return null;

    const id = 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const newTask = {
      id,
      name,
      description,
      status, // 'todo', 'in-progress', 'done'
      assignedTo
    };
    project.tasks.push(newTask);
    this.save();
    return newTask;
  },

  updateTask(projectId, taskId, updates) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return null;

    const task = project.tasks.find(t => t.id === taskId);
    if (task) {
      Object.assign(task, updates);
      this.save();
      return task;
    }
    return null;
  },

  deleteTask(projectId, taskId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return false;

    const index = project.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      project.tasks.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  },

  reorderTasks(projectId, fromIndex, toIndex) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    if (fromIndex >= 0 && fromIndex < project.tasks.length && toIndex >= 0 && toIndex < project.tasks.length) {
      const [removed] = project.tasks.splice(fromIndex, 1);
      project.tasks.splice(toIndex, 0, removed);
      this.save();
    }
  },

  moveTaskStatus(projectId, taskId, newStatus, newIndex = null) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return false;

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return false;

    // Xóa task khỏi vị trí cũ
    const currentIndex = project.tasks.findIndex(t => t.id === taskId);
    project.tasks.splice(currentIndex, 1);

    // Cập nhật trạng thái mới
    task.status = newStatus;

    if (newIndex !== null && newIndex >= 0) {
      // Tìm danh sách task có cùng status mới để chèn vào vị trí tương ứng trong danh sách tổng
      // Để làm điều này đơn giản hơn: chúng ta sẽ chèn vào mảng chung dựa trên chỉ số tương đối của cột đó.
      let inserted = false;
      let countOfNewStatus = 0;
      for (let i = 0; i < project.tasks.length; i++) {
        if (project.tasks[i].status === newStatus) {
          if (countOfNewStatus === newIndex) {
            project.tasks.splice(i, 0, task);
            inserted = true;
            break;
          }
          countOfNewStatus++;
        }
      }
      if (!inserted) {
        project.tasks.push(task);
      }
    } else {
      // Đưa xuống cuối danh sách
      project.tasks.push(task);
    }

    this.save();
    return true;
  },

  // Cập nhật chủ đề
  setTheme(theme) {
    this.theme = theme;
    this.save();
  }
};
