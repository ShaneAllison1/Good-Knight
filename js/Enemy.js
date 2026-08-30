const skeletonWalkImg = new Image();
skeletonWalkImg.src = './img/skeletonWalk.png';
class Enemy {
  constructor(x, y, kind = 'skeleton', type = 'basic') {
    this.x = x;
    this.y = y;
    this.kind = kind;
    this.type = type;
    this.isDead = false;
    this.state = 'walk';
    this.attackTimer = 0;
    //Base stats
    let baseHealth = type === 'elite' ? 25 : 5;
    let baseDamage = type === 'elite' ? 15 : 1;
    let baseGold = type === 'elite' ? 10 : 1;

    //Global difficulty multipliers
    const difficultyMultiplier = 1 + GAME_DATA.totalDistanceTraveled * GAME_DATA.diffacultyScalingFactor;
    //apply scaling directly to class
    this.maxHealth = Math.floor(baseHealth * difficultyMultiplier);
    this.damage = Math.floor(baseDamage * difficultyMultiplier);
    this.coinReward = Math.floor(baseGold * difficultyMultiplier);

    //Scale attributes based on type
    if (this.type == 'elite') {
      this.color = '#8e44ad';
      this.width = 128;
      this.spacingWidth = 96;
      this.height = 128;
      this.attackInterval = 1000;
    } else {
      this.color = '#e74c3c';
      this.width = 64;
      this.spacingWidth = 48;
      this.height = 64;
      this.attackInterval = 1000;
    }
    this.health = this.maxHealth;
    //Animation properties
    this.currentFrame = 0;
    this.animTimer = 0;
    this.animSpeed = 200;
    this.frameWidth = 32;
    this.frameHeight = 32;
    this.spriteCanvas = document.createElement('canvas');
    this.spriteCanvas.width = this.width;
    this.spriteCanvas.height = this.height;
    this.spriteContext = this.spriteCanvas.getContext('2d');
    this.spriteContext.imageSmoothingEnabled = false;
    this.animations = {
      idle: { image: skeletonWalkImg, maxFrames: 1, speed: 200, loop: true },
      walk: { image: skeletonWalkImg, maxFrames: 2, speed: 200, loop: true },
      // attack: { image: knightAttackImg, maxFrames: 3, speed: 100, loop: false },
      // takeDmg: { image: knightTakeDmgImg, maxFrames: 2, speed: 150, loop: false },
      // death: { image: knightDeathImg, maxFrames: 2, speed: 300, loop: false },
    };
  }

  //Handle taking damage from player
  takeDamage(player, amt) {
    if (this.isDead) return;

    this.health -= amt;
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      const levelsGained = player.xpGain(player.stats.xpGain);
      const spawnX = this.x;
      const spawnY = this.y + this.height / 2;
      //Have a chance to drop a gem instead of coin
      const gemChance = this.type === 'elite' ? 0.2 : 0.05;
      if (Math.random() < gemChance) {
        //Spawn single gem
        activeLoot.push(new Loot(spawnX, spawnY, 'gem'));
      } else {
        //Spawn coins based on enemy type
        const coinsToSpawn = this.coinReward * player.stats.enemyGold; //Return amount of coin on death
        for (let i = 0; i < coinsToSpawn; i++) {
          activeLoot.push(new Loot(spawnX, spawnY, 'coin'));
        }
      }
      for (let index = 0; index < levelsGained; index++) {
        activeLoot.push(new Loot(spawnX, spawnY, 'shard'));
      }
    }
    activeTexts.push(new FloatingTexts(this.x - camera.x + this.width, this.y, `${amt}`, 16, '#fff'));
    return 0; //Enemy still alive, no coin for you
  }

  update(deltaTime, player) {
    if (this.isDead) return;
    const distanceToPlayer = this.x - (player.x + player.width);
    //Only attack if player is alive and right in front of them
    if (!player.isDead && distanceToPlayer <= 5 && distanceToPlayer >= -this.width) {
      this.attackTimer += deltaTime;
      if (this.attackTimer >= this.attackInterval) {
        this.attack(player);
        this.attackTimer = 0;
      }
    }

    if (distanceToPlayer > 5) {
      this.x -= 0.5 * (deltaTime / 16.667);
    }

    const config = this.animations[this.state];
    this.animTimer += deltaTime;

    //Advance animations
    if (this.animTimer >= config.speed) {
      this.animTimer = 0;
      if (this.currentFrame < config.maxFrames - 1) {
        this.currentFrame++;
      } else {
        //Reached final frame of current animation
        if (config.loop) {
          this.currentFrame = 0;
        }
      }
    }
  }

  attack(player) {
    console.log('Emeny attacks');
    //Reduce players health
    let damageDone = this.damage - player.stats.armor;
    if (damageDone < 0) damageDone = 0;
    player.health -= damageDone;
    if (damageDone > 0) {
      //Trigger take damage animation
      player.changeAnimation('takeDmg');
      //Apply knock back
      player.knockBackVel = -8;
      //Activate visual flash
      player.isFlashing = true;
      player.flashTimer = player.flashDuration;
    }
    activeTexts.push(new FloatingTexts(player.x - camera.x, player.y, `${Math.floor(damageDone)}`, 16, '#721c1c'));
  }

  draw() {
    if (this.isDead) return;

    c.save();
    //Get settings for current animation
    const config = this.animations[this.state];
    //Horizontal pixel shift for sprite frame
    const cropX = this.currentFrame * this.frameWidth;
    const cropY = 0;
    const spriteContext = this.spriteContext;
    spriteContext.clearRect(0, 0, this.width, this.height);
    //Draw the specific frame onto a transparent surface
    spriteContext.drawImage(config.image, cropX, cropY, this.frameWidth, 32, 0, 0, this.width, this.height);
    c.restore();
    c.save();
    //Draw small overhead health bar
    const barWidth = this.width;
    const barHeight = 4;
    const barX = this.x;
    const barY = this.y - 10;
    c.fillStyle = '#c60000';
    const healthPerc = this.health / this.maxHealth;
    c.beginPath();
    c.roundRect(barX, barY, barWidth * healthPerc, barHeight, 4);
    c.fill();
    c.restore();

    c.drawImage(this.spriteCanvas, this.x, this.y);
  }
}
