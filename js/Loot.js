class Loot {
  constructor(x, y, type = 'coin') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 8;
    this.isDead = false;
    this.maxLife = 10000;
    this.lifeTimer = this.maxLife;
    //Physics engine
    //Shoot up and right
    this.vx = Math.random() * 7;
    this.vy = -Math.random() * 6 - 4;
    this.gravity = 0.4;
    this.bounceFriction = -0.5;
    this.floorY = 420;
    this.bouncesRemaining = 3;
  }

  update(deltaTime) {
    const ticks = deltaTime / 16.667;
    this.lifeTimer -= deltaTime;
    if (this.lifeTimer <= 0) {
      this.isDead = true;
      return;
    }
    //Apply gravity to vertical speed
    this.vy += this.gravity * ticks;
    //Apply velocities to coordinates
    this.x += this.vx * ticks;
    this.y += this.vy * ticks;

    //Floor collision detection
    if (this.y + this.radius >= this.floorY) {
      this.y = this.floorY - this.radius;

      if (this.bouncesRemaining > 0) {
        this.vy *= this.bounceFriction;
        this.vx *= 0.8;
        this.bouncesRemaining--;
      } else {
        //Complete stop
        this.vx = 0;
        this.vy = 0;
      }
    }
  }

  draw() {
    c.save();
    if (this.type === 'coin') {
      c.drawImage(coinImg, this.x, this.y, this.radius * 2, this.radius * 2);
    } else if (this.type === 'gem') {
      c.drawImage(gemImg, this.x, this.y, this.radius * 2, this.radius * 2);
    } else if (this.type === 'shard') {
      c.drawImage(shardImg, this.x, this.y, this.radius * 2, this.radius * 2);
    }
    c.restore();
  }
}
