class SlashEffect {
  constructor(x, y, range) {
    this.x = x;
    this.y = y;
    this.range = range;
    this.isDead = false;
    //Timing tracking variables
    this.maxLife = 200;
    this.lifeTimer = this.maxLife;
    //Slight expansion effect
    this.currentScale = 0.8;
  }

  update(deltaTime) {
    this.lifeTimer -= deltaTime;
    if (this.lifeTimer <= 0) {
      this.isDead = true;
      return;
    }

    //Smoothly scale up arc from 80% - 100% of attack range
    const lifePerc = (this.maxLife - this.lifeTimer) / this.maxLife;
    this.currentScale = 0.8 + lifePerc * 0.2;
  }

  draw() {
    c.save();
    const alpha = Math.max(this.lifeTimer / this.maxLife, 0);
    c.globalAlpha = alpha;
    //Calculate arc size based on expansion
    const radius = this.range * this.currentScale;
    //Define sweeping slash angle
    const startAngle = -Math.PI / 4;
    const endAngle = Math.PI / 4;
    //Bright white glowing gradient effect
    c.beginPath();
    c.arc(this.x, this.y, radius, startAngle, endAngle);
    c.lineWidth = 12;
    c.lineCap = 'round';
    c.strokeStyle = '#fff';
    c.shadowColor = 'rgba(255, 255, 255, 0.8)';
    c.shadowBlur = 15;
    c.stroke();
    c.restore();
  }
}
