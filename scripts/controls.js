class Controls {
   constructor(render) {
    if (!render) throw new Error("Render is required for instantiation");
    if (Controls.instance) {
      return Controls.instance;
    }
    this.isDragging = false;
    this.isResizing = false;
    this.isRotating = false;
    this.startX = 0;
    this.startY = 0;
    this.lastAngle = 0;
    this.currentHandle = null;
    this.canvas = render.canvas;
    this.render = render;
    this.mousePos = {x: 0, y: 0};
    this.shiftKeyPressed = false;
    this.rotationSensitivity = 50 / 1000;
    this.zoomSensitivity = 50 / 1000;
    this.isMouseOverCanvas = false;

    Controls.instance = this;
    this.registerListeners();
  }
  onMouseDown(evt) {
    const pos = this.mousePos;
    this.currentHandle = this.getHandleUnderMouse(pos);
    const {imgX, imgY, imgRotation} = this.render;

    if (this.currentHandle === "rotate") {
      this.isRotating = true;
      this.lastAngle = Math.atan2(pos.y - imgY, pos.x - imgX) - imgRotation;
    } else if (this.currentHandle !== null) {
      this.isResizing = true;
    } else if (this.isMouseOverImage(pos)) {
      this.isDragging = true;
      this.startX = pos.x;
      this.startY = pos.y;
    }
  }
  onMouseMove(evt) {
    const pos = this._getMousePos(evt);
    let {imgX, imgY, imgRotation, imgScale} = this.render;

    if (this.isDragging) {
      const dx = pos.x - this.startX;
      const dy = pos.y - this.startY;
      imgX += dx;
      imgY += dy;
      this.startX = pos.x;
      this.startY = pos.y;
    } else if (this.isResizing) {
      const corners = this.render.getTransformedCorners();
      const handleIndex = this.currentHandle;
      const oppositeCorner = corners[(handleIndex + 2) % 4];
      const dx = pos.x - oppositeCorner.x;
      const dy = pos.y - oppositeCorner.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const originalDistance = Math.sqrt(
        Math.pow(corners[handleIndex].x - oppositeCorner.x, 2) +
          Math.pow(corners[handleIndex].y - oppositeCorner.y, 2)
      );

      const scaleChange = distance / originalDistance;
      imgScale *= scaleChange;

    } else if (this.isRotating) {
      const angle = Math.atan2(pos.y - imgY, pos.x - imgX);
      imgRotation = angle - this.lastAngle;
    } else {
      this.render.canvas.style.cursor = this.getCursorStyle(pos);
    }
    this.render.imgX = imgX;
    this.render.imgY = imgY;
    this.render.imgRotation = imgRotation;
    this.render.imgScale = imgScale;
  }
  onMouseUp(evt) {
    this.isDragging = false;
    this.isResizing = false;
    this.isRotating = false;
    this.currentHandle = null;
  }
  // Method to handle mouse scroll events
  onMouseScroll(evt) {
    if (!this.isMouseOverCanvas) return;
    const delta = evt.deltaY > 0 ? -1 : 1; // Zoom out or in
    if (this.shiftKeyPressed) {
      // Rotate
      this.render.imgRotation += delta * this.rotationSensitivity;
    } else {
      // Scale
      this.render.imgScale += delta * this.zoomSensitivity;
      this.render.imgScale = Math.max(0.1, this.render.imgScale); // Prevent negative scale
    }
  }
  // Method to handle keydown events
  onKeyDown(evt) {
    switch (evt.key) {
      case "ArrowUp":
        this.render.imgY -= 10; // Move image up
        break;
      case "ArrowDown":
        this.render.imgY += 10; // Move image down
        break;
      case "ArrowLeft":
        this.render.imgX -= 10; // Move image left
        break;
      case "ArrowRight":
        this.render.imgX += 10; // Move image right
        break;
      case "Shift":
        this.shiftKeyPressed = true;
        break;
      case "Delete":
        FileManager.instance.activeImage = null;
        break;
      // Add more key controls as needed
    }
  }
  onKeyUp(evt) {
    if (evt.key === "Shift") {
      this.shiftKeyPressed = false;
    }
  }
      // Method to determine the cursor style based on mouse position
  getCursorStyle(pos) {
    const corners = this.render.getTransformedCorners();
    const handleSize = this.render.handleSize || 0;
    if (corners.length !== 4) return 'default';
    // Check corner handles
    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i];
      if (
        pos.x >= corner.x - handleSize / 2 &&
        pos.x <= corner.x + handleSize / 2 &&
        pos.y >= corner.y - handleSize / 2 &&
        pos.y <= corner.y + handleSize / 2
      ) {
        // Return different cursor styles for each corner
        switch (i) {
          case 0: return 'nwse-resize'; // Top-left corner
          case 1: return 'nesw-resize'; // Top-right corner
          case 2: return 'nwse-resize'; // Bottom-right corner
          case 3: return 'nesw-resize'; // Bottom-left corner
        }
      }
    }

    // Check rotation handle

    const topCenterX = (corners[0].x + corners[1].x) / 2;
    const topCenterY = (corners[0].y + corners[1].y) / 2 - 30;
    if (
      pos.x >= topCenterX - handleSize / 2 &&
      pos.x <= topCenterX + handleSize / 2 &&
      pos.y >= topCenterY - handleSize / 2 &&
      pos.y <= topCenterY + handleSize / 2
    ) {
      return 'crosshair'; // Rotation handle
    }

    // Check if mouse is over the image
    if (this.isMouseOverImage(pos)) {
      return 'grab'; // Over the image
    }

    return 'default'; // Default cursor
  }
  getHandleUnderMouse(pos) {
    const corners = this.render.getTransformedCorners();
    const handleSize = this.render.handleSize || 0;

    // Check corner handles
    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i];
      if (
        Math.abs(pos.x - corner.x) <= handleSize / 2 &&
        Math.abs(pos.y - corner.y) <= handleSize / 2
      ) {
        return i;
      }
    }

    // Check rotation handle
    const topCenterX = (corners[0].x + corners[1].x) / 2;
    const topCenterY = (corners[0].y + corners[1].y) / 2 - 30;

    if (
      Math.abs(pos.x - topCenterX) <= handleSize / 2 &&
      Math.abs(pos.y - topCenterY) <= handleSize / 2
    ) {
      return "rotate";
    }

    return null;
  }
  _getMousePos(evt) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos = {
      x: (evt.clientX || 0) - rect.left,
      y: (evt.clientY || 0) - rect.top,
    };
    return this.mousePos;
  }
  isMouseOverImage() {
    const { imgX, imgY, imgRotation, imgScale } = this.render;
    const img = FileManager.instance.activeImage;
    const pos = this.mousePos;
    if (!pos) return false;
    if (!img) return false;
    // Inverse transform the point
    const dx = pos.x - imgX;
    const dy = pos.y - imgY;
    const sin = Math.sin(-imgRotation);
    const cos = Math.cos(-imgRotation);
    const x = dx * cos - dy * sin;
    const y = dx * sin + dy * cos;
    const halfWidth = (img.width * imgScale) / 2;
    const halfHeight = (img.height * imgScale) / 2;
    return (
      x > -halfWidth && x < halfWidth && y > -halfHeight && y < halfHeight
    );
  }

  registerListeners() {
    const canvas = this.canvas;
    canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    canvas.addEventListener("mouseout", this.onMouseUp.bind(this));
    canvas.addEventListener("wheel", this.onMouseScroll.bind(this), {passive: true});
    canvas.addEventListener("mouseenter", () => this.isMouseOverCanvas = true);
    canvas.addEventListener("mouseleave", () => this.isMouseOverCanvas = false);
    window.addEventListener("keydown", this.onKeyDown.bind(this));
    window.addEventListener("keyup", this.onKeyUp.bind(this));
  }
}