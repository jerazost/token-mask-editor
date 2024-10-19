// Handle mask selection
class Mask {
  constructor(render) {
    this.render = render;
    this.maskThumbnails = document.querySelectorAll(".maskThumbnail");
    this.maskThumbnails.forEach(thumbnail => {
      thumbnail.addEventListener('click', () => this.selectMask(thumbnail));
    });
    if (this.maskThumbnails.length > 1) {
      this.selectMask(this.maskThumbnails[1]);
    }
  }
  selectMask(thumbnail) {
    this.maskThumbnails.forEach(thumb => thumb.classList.remove('selected'));
    thumbnail.classList.add('selected');
    this.maskImg = new Image();
    this.maskImg.src = thumbnail.getAttribute('data-mask');
    this.render.maskImg = this.maskImg;
  }
}