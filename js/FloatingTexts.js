class FloatingTexts {
  constructor(x, y, text, size, color = '#e4c829') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.size = size;
    this.color = color;
    this.isDead = false;

    //Movement speeds
    this.vx = 0;
    this.vy = -1.5;

    //Life confirmation params
    this.maxLife = 1500;
    this.lifeTimer = this.maxLife;
  }

  update(deltaTime) {
    this.lifeTimer -= deltaTime;
    if (this.lifeTimer <= 0) {
      this.isDead = true;
      return;
    }
    //Apply movement
    const ticks = deltaTime / 16.667;
    this.x += this.vx * ticks;
    this.y += this.vy * ticks;
  }

  draw() {
    c.save();
    //Calculate opacity based on life
    const alpha = Math.max(this.lifeTimer / this.maxLife, 0);
    c.globalAlpha = alpha;
    //Text styling
    c.fillStyle = this.color;
    c.font = `${this.size}px Tiny5, monospace`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.shadowColor = '#000';
    c.shadowBlur = 20;
    //Draw text
    c.fillText(this.text, this.x, this.y);
    c.restore();
  }
}
