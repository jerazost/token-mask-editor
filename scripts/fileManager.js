class FileManager {
  constructor(render) {
    if (FileManager.instance) {
      return FileManager.instance;
    }
    FileManager.instance = this;
    this._registerEventListeners();
    this.activeImage = null;
    this.activeImageName = "";
    this.render = render;
  }
  handleExportImage(withRing) {
    this.render.draw({ 
      renderBackground: false,
      renderImage: true,
      renderRing: withRing,
      renderMask: true,
      renderHandles: false
    });
    this.triggerDownload(this.render.canvas, withRing);
  }
  triggerDownload(canvas, withRing) {
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `${this.activeImageName}-${withRing ? "ring-" : ""}token.png`;
    link.click();
  }
  handleDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length) this.readFile(files[0]);
  }
  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) this.readFile(file);
  }
  readFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const maxDimension = 480;
        const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
        this.render.imgScale = scale;
      }
      this.activeImageName = file.name.split(".")[0];
      this.activeImage = img;
    };
    reader.onerror = () => {
      console.error("Error reading file");
    };
    reader.readAsDataURL(file);
  }
  _registerEventListeners() {
    const exportWithRingBtn = document.getElementById("exportWithRingBtn");
    const exportWithoutRingBtn = document.getElementById("exportWithoutRingBtn");
    exportWithRingBtn.addEventListener("click", () => this.handleExportImage(true));
    exportWithoutRingBtn.addEventListener("click", () => this.handleExportImage(false));
    const imageDropArea = document.getElementById("imageDropArea");
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    }
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      imageDropArea.addEventListener(eventName, preventDefaults, false);
    });
    // Highlight canvas when item is dragged over
    ['dragenter', 'dragover'].forEach(eventName => {
      imageDropArea.addEventListener(eventName, () => {
        imageDropArea.classList.add('highlight');
      }, false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
      imageDropArea.addEventListener(eventName, () => {
        imageDropArea.classList.remove('highlight');
      }, false);
    });
    imageDropArea.addEventListener("drop", this.handleDrop.bind(this), false);
  }
}