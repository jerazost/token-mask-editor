const defaultOptions = {
  renderBackground: true,
  renderRing: true,
  renderImage: true,
  renderMask: true,
  renderHandles: true,
}
class Render {
  
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.tokenRingImg = new Image(canvas.width, canvas.height);
    this.tokenRingImg.src = "ring.png";

    // Initialize image properties.
    this.imgX = canvas.width / 2;
    this.imgY = canvas.height / 2;
    this.imgScale = 1;
    this.imgRotation = 0;
    this.handleSize = 15; // Example handle size
    this.handleColor = "#14213d";
  }

  draw(options = {}) {
    options = { ...defaultOptions, ...options };
    const ctx = this.ctx;

    const backgroundLayer = this._createCanvas();
    const backgroundCtx = backgroundLayer.getContext("2d");

    const imageLayer = this._createCanvas();
    const imageCtx = imageLayer.getContext("2d");

    const uiLayer = this._createCanvas();
    const uiCtx = uiLayer.getContext("2d");

    if (options.renderBackground) this.drawTransparencyGrid(backgroundCtx);
    if (options.renderRing) this.drawTokenRingImage(backgroundCtx);
    if (options.renderImage) this.drawImageWithTransformations(imageCtx);
    if (options.renderMask) this.drawMask(imageCtx);
    if (options.renderHandles) this.drawHandles(uiCtx);

    this.clearCanvas(ctx);
    ctx.drawImage(backgroundLayer, 0, 0);
    ctx.drawImage(imageLayer, 0, 0);
    ctx.drawImage(uiLayer, 0, 0);
  }

  clearCanvas(ctx) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawTransparencyGrid(ctx) {
    const gridSize = 10;
    for (let y = 0; y < this.canvas.height; y += gridSize) {
      for (let x = 0; x < this.canvas.width; x += gridSize) {
        ctx.fillStyle = (x / gridSize + y / gridSize) % 2 === 0 ? '#ccc' : '#fff';
        ctx.fillRect(x, y, gridSize, gridSize);
      }
    }
  }

  drawTokenRingImage(ctx) {
    if (!this.tokenRingImg?.complete) return;
    ctx.drawImage(this.tokenRingImg, 0, 0, this.canvas.width, this.canvas.height);
  }

  drawImageWithTransformations(ctx) {
    const activeImage = FileManager.instance.activeImage;
    if (!activeImage) return;
    ctx.save();
    ctx.translate(this.imgX, this.imgY);
    ctx.rotate(this.imgRotation);
    ctx.scale(this.imgScale, this.imgScale);
    ctx.drawImage(activeImage, -activeImage.width / 2, -activeImage.height / 2);
    ctx.restore();
  }
  drawMask(ctx) {
    if (!this.maskImg) return;
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(this.maskImg, 0, 0, this.canvas.width, this.canvas.height);
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }
  drawHandles(ctx) {
    const corners = this.getTransformedCorners();
    if (!corners.length) return;
    ctx.save();
    ctx.fillStyle = this.handleColor;
    ctx.strokeStyle = this.handleColor;

    // Draw lines connecting corners
    ctx.beginPath();
    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i];
      if (i === 0) {
        ctx.moveTo(corner.x, corner.y);
      } else {
        ctx.lineTo(corner.x, corner.y);
      }
    }
    ctx.closePath();
    ctx.stroke();

    // Draw handles at corners
    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i];
      ctx.fillRect(
        corner.x - this.handleSize / 2,
        corner.y - this.handleSize / 2,
        this.handleSize,
        this.handleSize
      );
    }

    const angle = this.imgRotation;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const topCenter = {
      x: (corners[0].x + corners[1].x) / 2 + 30 * sin,
      y: (corners[0].y + corners[1].y) / 2 - 30 * cos,
    };

    ctx.beginPath();
    ctx.arc(topCenter.x, topCenter.y, this.handleSize / 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(
      (corners[0].x + corners[1].x) / 2,
      (corners[0].y + corners[1].y) / 2
    );
    ctx.lineTo(topCenter.x, topCenter.y);
    ctx.stroke();
    ctx.restore();
  }
  // Add a method to check if the mouse is over a corner
    // Add a method to check if the mouse is over a corner and return the index
  getMouseOverCornerIndex(mouseX, mouseY) {
    const corners = this.getTransformedCorners();
    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i];
      if (
        mouseX >= corner.x - this.handleSize / 2 &&
        mouseX <= corner.x + this.handleSize / 2 &&
        mouseY >= corner.y - this.handleSize / 2 &&
        mouseY <= corner.y + this.handleSize / 2
      ) {
        return i; // Return the index of the corner
      }
    }
    return -1; // Return -1 if no corner is hovered
  }
  getTransformedCorners() {
    if (!FileManager.instance.activeImage) return [];

    const w = FileManager.instance.activeImage.width * this.imgScale;
    const h = FileManager.instance.activeImage.height * this.imgScale;
    const angle = this.imgRotation;

    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const halfWidth = w / 2;
    const halfHeight = h / 2;

    return [
      { x: this.imgX + (-halfWidth * cos - -halfHeight * sin), y: this.imgY + (-halfWidth * sin + -halfHeight * cos) },
      { x: this.imgX + (halfWidth * cos - -halfHeight * sin), y: this.imgY + (halfWidth * sin + -halfHeight * cos) },
      { x: this.imgX + (halfWidth * cos - halfHeight * sin), y: this.imgY + (halfWidth * sin + halfHeight * cos) },
      { x: this.imgX + (-halfWidth * cos - halfHeight * sin), y: this.imgY + (-halfWidth * sin + halfHeight * cos) }
    ];
  }
  _createCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
    return canvas;
  }
  
}