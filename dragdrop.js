// dragdrop.js
// Quản lý kéo thả đa nền tảng bằng Pointer Events (chuột + cảm ứng điện thoại)

export class DragDropManager {
  constructor(onDragEndCallback) {
    this.onDragEnd = onDragEndCallback;
    this.activeDrag = null;
    this.placeholder = null;
    this.ghost = null;
    
    // Bind sự kiện
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    
    this.init();
  }

  init() {
    // Lắng nghe sự kiện click/pointerdown ở cấp độ document để hỗ trợ các phần tử sinh động (dynamic DOM)
    document.addEventListener('pointerdown', this.handlePointerDown);
  }

  destroy() {
    document.removeEventListener('pointerdown', this.handlePointerDown);
  }

  handlePointerDown(e) {
    // Chỉ xử lý chuột trái (button = 0) hoặc ngón tay cảm ứng
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Tìm phần tử draggable gần nhất hoặc phần tử chứa nút kéo (handle)
    const handle = e.target.closest('.drag-handle');
    let draggable = e.target.closest('.draggable');
    
    // Nếu có drag-handle, sự kiện bắt đầu kéo phải xuất phát từ handle đó.
    // Nếu không có drag-handle cụ thể, phần tử draggable chính nó sẽ tự xử lý.
    if (draggable && draggable.querySelector('.drag-handle') && !handle) {
      return; // Phải nhấn vào nút kéo để kéo
    }

    if (!draggable) return;

    e.preventDefault();

    const type = draggable.getAttribute('data-drag-type'); // 'project-list', 'task-list', 'task-kanban', 'project-matrix'
    const id = draggable.getAttribute('data-id');
    const parentId = draggable.getAttribute('data-parent-id'); // Id của dự án cha (nếu kéo task)

    // Lấy tọa độ và kích thước ban đầu
    const rect = draggable.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Thiết lập trạng thái kéo tích cực
    this.activeDrag = {
      element: draggable,
      type,
      id,
      parentId,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX,
      offsetY,
      width: rect.width,
      height: rect.height,
      initialIndex: Array.from(draggable.parentNode.children).indexOf(draggable),
      originalParent: draggable.parentNode,
      currentParent: draggable.parentNode,
      targetDropZone: null,
      targetIndex: -1
    };

    // Chiếm quyền điều khiển Pointer để tiếp tục nhận sự kiện dù trỏ chuột di chuyển ra ngoài phần tử
    draggable.setPointerCapture(e.pointerId);

    // Đăng ký các sự kiện tiếp theo trên chính phần tử đang được kéo
    draggable.addEventListener('pointermove', this.handlePointerMove);
    draggable.addEventListener('pointerup', this.handlePointerUp);
    draggable.addEventListener('pointercancel', this.handlePointerUp);

    // Kích hoạt giao diện kéo sau một khoảng trễ nhỏ (để tránh kéo nhầm khi chỉ click)
    this.dragStartTimeout = setTimeout(() => {
      this.startDragVisuals(e);
    }, 100);
  }

  startDragVisuals(e) {
    if (!this.activeDrag || this.ghost) return;

    const drag = this.activeDrag;
    const el = drag.element;

    // 1. Tạo placeholder để giữ chỗ trống trong danh sách gốc
    this.placeholder = document.createElement('div');
    this.placeholder.className = 'drag-placeholder';
    this.placeholder.style.width = drag.width + 'px';
    this.placeholder.style.height = drag.height + 'px';
    el.parentNode.insertBefore(this.placeholder, el.nextSibling);

    // 2. Tạo ghost element (ảnh ảo di chuyển theo ngón tay/chuột)
    this.ghost = el.cloneNode(true);
    this.ghost.classList.add('drag-ghost');
    this.ghost.style.position = 'fixed';
    this.ghost.style.width = drag.width + 'px';
    this.ghost.style.height = drag.height + 'px';
    this.ghost.style.left = (e.clientX - drag.offsetX) + 'px';
    this.ghost.style.top = (e.clientY - drag.offsetY) + 'px';
    this.ghost.style.pointerEvents = 'none'; // Rất quan trọng: cho phép document.elementFromPoint đi xuyên qua ghost
    this.ghost.style.zIndex = '9999';
    document.body.appendChild(this.ghost);

    // 3. Ẩn phần tử gốc bằng class `.dragging`
    el.classList.add('dragging');
  }

  handlePointerMove(e) {
    if (!this.activeDrag) return;
    
    const drag = this.activeDrag;
    if (drag.pointerId !== e.pointerId) return;

    // Kiểm tra xem đã bắt đầu kéo giao diện chưa
    if (!this.ghost) {
      // Nếu di chuyển quá 5px, bắt đầu kéo ngay lập tức
      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      if (dist > 5) {
        clearTimeout(this.dragStartTimeout);
        this.startDragVisuals(e);
      }
      return;
    }

    e.preventDefault();

    // Cập nhật vị trí ghost
    this.ghost.style.left = (e.clientX - drag.offsetX) + 'px';
    this.ghost.style.top = (e.clientY - drag.offsetY) + 'px';

    // Xác định phần tử bên dưới con trỏ
    // Vì ghost có pointerEvents = 'none', elementFromPoint sẽ trả về phần tử thực sự bên dưới nó
    const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
    if (!elementUnder) return;

    // Tìm vùng drop zone phù hợp
    let dropZone = elementUnder.closest('.drop-zone');
    
    // Nếu tìm thấy dropZone, hãy kiểm tra loại của nó có khớp với kiểu kéo không
    if (dropZone) {
      const zoneType = dropZone.getAttribute('data-drop-zone-type');
      let isCompatible = false;
      
      if (drag.type === 'project-list' && zoneType === 'project-list') isCompatible = true;
      if (drag.type === 'task-list' && zoneType === 'task-list') isCompatible = true;
      if (drag.type === 'task-kanban' && zoneType === 'kanban-column') isCompatible = true;
      if (drag.type === 'project-matrix' && zoneType === 'matrix-quadrant') isCompatible = true;

      if (!isCompatible) {
        dropZone = null;
      }
    }

    // Xử lý hover/placeholder dựa trên từng loại kéo thả
    if (dropZone) {
      this.updateDropPreview(dropZone, e.clientX, e.clientY);
    } else {
      // Di chuyển ngoài vùng drop, ẩn hoặc giữ nguyên placeholder ở vùng gần nhất
      this.clearDragOverClasses();
      drag.targetDropZone = null;
      drag.targetIndex = -1;
    }
  }

  updateDropPreview(dropZone, clientX, clientY) {
    const drag = this.activeDrag;
    drag.targetDropZone = dropZone;

    // Làm sạch class hover ở các zone khác
    this.clearDragOverClasses();
    dropZone.classList.add('drag-over');

    if (drag.type === 'project-matrix') {
      // Với Eisenhower matrix, chỉ cần thả vào ô tương ứng, không cần sắp xếp thứ tự
      drag.targetIndex = 0;
      if (this.placeholder) this.placeholder.remove();
      return;
    }

    // Tìm vị trí chèn tốt nhất trong danh sách (cho project-list, task-list, task-kanban)
    const children = Array.from(dropZone.children).filter(child => {
      return child !== drag.element && child !== this.placeholder && child !== this.ghost;
    });

    let bestIndex = children.length;
    let minDistance = Infinity;

    // Di chuyển placeholder đến drop zone mới nếu đổi zone
    if (this.placeholder.parentNode !== dropZone) {
      dropZone.appendChild(this.placeholder);
    }

    // Tính toán khoảng cách để chèn phần tử
    children.forEach((child, index) => {
      const box = child.getBoundingClientRect();
      
      // Tính toán khoảng cách dựa trên trục dọc (cho list) hoặc trục ngang (nếu là hàng ngang)
      let distance;
      if (drag.type === 'task-kanban' || drag.type === 'task-list' || drag.type === 'project-list') {
        // Trục dọc
        const childCenterY = box.top + box.height / 2;
        distance = clientY - childCenterY;
        
        if (clientY < childCenterY && box.top < minDistance) {
          bestIndex = index;
          minDistance = box.top;
        }
      }
    });

    // Nếu không tìm được vị trí chèn phía trước thẻ nào, nó sẽ nằm ở cuối danh sách
    if (minDistance === Infinity) {
      bestIndex = children.length;
    }

    // Chèn placeholder vào vị trí tương ứng trong DOM
    if (children.length === 0) {
      dropZone.appendChild(this.placeholder);
      drag.targetIndex = 0;
    } else if (bestIndex < children.length) {
      dropZone.insertBefore(this.placeholder, children[bestIndex]);
      drag.targetIndex = bestIndex;
    } else {
      dropZone.appendChild(this.placeholder);
      drag.targetIndex = children.length;
    }
  }

  handlePointerUp(e) {
    if (!this.activeDrag) return;

    const drag = this.activeDrag;
    if (drag.pointerId !== e.pointerId) return;

    clearTimeout(this.dragStartTimeout);

    // Giải phóng Pointer capture
    drag.element.releasePointerCapture(drag.pointerId);

    // Hủy lắng nghe các sự kiện kéo trên phần tử này
    drag.element.removeEventListener('pointermove', this.handlePointerMove);
    drag.element.removeEventListener('pointerup', this.handlePointerUp);
    drag.element.removeEventListener('pointercancel', this.handlePointerUp);

    // Loại bỏ giao diện kéo
    if (this.ghost) {
      this.ghost.remove();
      this.ghost = null;
    }

    if (this.placeholder) {
      this.placeholder.remove();
      this.placeholder = null;
    }

    drag.element.classList.remove('dragging');
    this.clearDragOverClasses();

    // Kiểm tra xem việc thả có hợp lệ không
    const dropZone = drag.targetDropZone;
    if (dropZone) {
      const dropZoneType = dropZone.getAttribute('data-drop-zone-type');
      
      let changed = false;
      const dragResult = {
        type: drag.type,
        id: drag.id,
        parentId: drag.parentId,
        fromIndex: drag.initialIndex,
        toIndex: drag.targetIndex
      };

      if (drag.type === 'project-list' && dropZoneType === 'project-list') {
        if (drag.initialIndex !== drag.targetIndex) {
          changed = true;
        }
      } else if (drag.type === 'task-list' && dropZoneType === 'task-list') {
        if (drag.initialIndex !== drag.targetIndex) {
          changed = true;
        }
      } else if (drag.type === 'task-kanban' && dropZoneType === 'kanban-column') {
        const newStatus = dropZone.getAttribute('data-status');
        const oldStatus = drag.element.getAttribute('data-status');
        
        if (oldStatus !== newStatus || drag.initialIndex !== drag.targetIndex) {
          dragResult.newStatus = newStatus;
          changed = true;
        }
      } else if (drag.type === 'project-matrix' && dropZoneType === 'matrix-quadrant') {
        const newQuadrant = parseInt(dropZone.getAttribute('data-quadrant'));
        const oldQuadrant = parseInt(drag.element.getAttribute('data-quadrant'));
        
        if (oldQuadrant !== newQuadrant) {
          dragResult.newQuadrant = newQuadrant;
          changed = true;
        }
      }

      if (changed && this.onDragEnd) {
        this.onDragEnd(dragResult);
      }
    }

    this.activeDrag = null;
  }

  clearDragOverClasses() {
    document.querySelectorAll('.drop-zone.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
  }
}
