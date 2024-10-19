document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  const mainRender = new Render(canvas);
  new FileManager(mainRender);
  const controls = new Controls(mainRender);
  new Mask(mainRender);

  function update() {
    mainRender.draw({
      renderHandles: controls.isMouseOverImage() || !!controls.currentHandle
    });
    requestAnimationFrame(update);
  }

  update();
});
