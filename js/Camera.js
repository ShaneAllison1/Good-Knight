class Camera {
  constructor(canvasWidth, canvasHeight) {
    this.x = 0;
    this.y = 0;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    //Padding sets how far from the left edge the player sits
    this.screenPaddingX = canvas.width / 2;
  }

  //Focus camera ahead of player's current X position
  update(playerX) {
    this.x = playerX - this.screenPaddingX;
    if (this.x < 0) this.x = 0;
  }

  //Apply camera transformation offset matrix
  apply() {
    c.save();
    //Translate in the negative direction to move the world backwards
    c.translate(-Math.floor(this.x), -Math.floor(this.y));
  }

  //Restore canvas back so HUD does not move
  restore() {
    c.restore();
  }
}
