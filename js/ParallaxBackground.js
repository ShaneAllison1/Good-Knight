const bgLayer1 = new Image();
bgLayer1.src = './img/bg/background_1.png';
const bgLayer2 = new Image();
bgLayer2.src = './img/bg/background_2.png';
const bgLayer3 = new Image();
bgLayer3.src = './img/bg/background_3.png';
const bgLayer4 = new Image();
bgLayer4.src = './img/bg/background_4.png';
const bgLayer5 = new Image();
bgLayer5.src = './img/bg/background_5.png';

class ParallaxBackground {
  constructor(canvasWidth, floorY) {
    this.canvasWidth = canvasWidth;
    this.floorY = floorY;

    //Define layers ordered back to front
    this.layers = [
      { img: bgLayer1, speed: 0 },
      { img: bgLayer2, speed: 0.15 },
      { img: bgLayer3, speed: 0.3 },
      { img: bgLayer4, speed: 0.45 },
      { img: bgLayer5, speed: 0.6 },
    ];
  }

  draw(cameraX) {
    c.save();
    this.layers.forEach((layer) => {
      //Determine if image is loaded
      if (!layer.img.complete || layer.img.width === 0) return;
      const imageWidth = layer.img.width;
      //Calculate how far each image needs to shift
      const scrollPosition = cameraX * layer.speed;
      //Reset image coords after entire width passes
      const offsetX = -(scrollPosition % imageWidth);
      const tilesNeeded = Math.ceil(this.canvasWidth / imageWidth) + 1;
      for (let index = 0; index < tilesNeeded; index++) {
        c.drawImage(layer.img, offsetX + index * imageWidth, 0, imageWidth, this.floorY);
      }
    });
    c.restore();
  }
}
