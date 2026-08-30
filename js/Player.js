const knightWalkImg = new Image();
knightWalkImg.src = './img/knightWalk.png';
const knightAttackImg = new Image();
knightAttackImg.src = './img/kinghtAttack.png';
const knightTakeDmgImg = new Image();
knightTakeDmgImg.src = './img/knightTakeDmg.png';
const knightDeathImg = new Image();
knightDeathImg.src = './img/knightDeath.png';
class Knight {
  constructor(x, y, color = '#3498db') {
    this.x = x;
    this.y = y;
    this.width = 64;
    this.height = 64;
    this.color = color;
    this.attackTimer = 0;
    this.inCombat = false;
    this.baseStats = {
      meleeDamage: 1,
      attackInterval: 1000,
      maxHealth: 100,
      attackRange: 20,
      moveSpeed: 3,
      armor: 0,
      healthDecay: 5,
      xpGain: 2,
      cursorLootMult: 1,
      autoAttack: false,
      enemyGold: 1,
      gemChance: 0.001,
    };
    this.stats = { ...this.baseStats };
    this.health = this.stats.maxHealth;
    this.xp = 0;
    this.level = 0;
    this.nextXpLevel = 100;
    this.xpScalar = 1.2;
    this.isDead = false;
    this.state = 'walk';
    //Knock back when taking damage
    this.knockBackVel = 0;
    this.knockBackFric = 0.85;
    this.isFlashing = false;
    this.flashTimer = 0;
    this.flashDuration = 150;
    //Animation properties
    this.currentFrame = 0;
    this.animTimer = 0;
    this.animSpeed = 200 / (this.stats.moveSpeed / this.baseStats.moveSpeed);
    this.frameWidth = 32;
    this.frameHeight = 32;
    this.spriteCanvas = document.createElement('canvas');
    this.spriteCanvas.width = this.width;
    this.spriteCanvas.height = this.height;
    this.spriteContext = this.spriteCanvas.getContext('2d');
    this.spriteContext.imageSmoothingEnabled = false;
    this.animations = {
      idle: { image: knightWalkImg, maxFrames: 1, speed: 200, loop: true },
      walk: { image: knightWalkImg, maxFrames: 2, speed: 200, loop: true },
      attack: { image: knightAttackImg, maxFrames: 3, speed: 100, loop: false },
      takeDmg: { image: knightTakeDmgImg, maxFrames: 2, speed: 150, loop: false },
      death: { image: knightDeathImg, maxFrames: 2, speed: 300, loop: false },
    };
  }

  recalculateStats(upgradeList) {
    //Reset back to baseline values
    this.stats.meleeDamage = this.baseStats.meleeDamage;
    this.stats.attackInterval = this.baseStats.attackInterval;
    this.stats.moveSpeed = this.baseStats.moveSpeed;
    this.stats.maxHealth = this.baseStats.maxHealth;
    this.stats.attackRange = this.baseStats.attackRange;
    this.stats.armor = this.baseStats.armor;
    this.stats.cursorLootMult = this.baseStats.cursorLootMult;
    this.stats.enemyGold = this.baseStats.enemyGold;

    let additions = [];
    let multipliers = [];

    //Filter upgrade types
    Object.values(upgradeList).forEach((node) => {
      if (node.purchased && node.effect && node.level > 0) {
        //Scale effect by number of levels purchased
        if (node.effect.type === 'add')
          additions.push({ stat: node.effect.stat, value: node.effect.value * node.level });
        if (node.effect.type === 'multiply')
          multipliers.push({
            stat: node.effect.stat,
            value: Math.pow(1 + node.effect.value, node.level) - 1,
          });
        if (node.effect.type === 'set') this.stats.autoAttack = true;
      }
    });

    //Apply flat additions first
    additions.forEach((effect) => {
      if (this.stats[effect.stat] !== undefined) {
        this.stats[effect.stat] += effect.value;
      }
    });

    //Apply multipliers second
    multipliers.forEach((effect) => {
      if (this.stats[effect.stat] !== undefined) {
        this.stats[effect.stat] *= 1 + effect.value;
      }
    });

    //Ensure health does not exceed calculated maxhealth
    if (this.health > this.stats.maxHealth) {
      this.health = this.stats.maxHealth;
    }
  }

  update(deltaTime) {
    //Convert deltatime form milliseconds to seconds
    const secondsPassed = deltaTime / 1000;
    //Core state logic changes
    if (!this.isDead) {
      //Decrease health over time, increase xp over time
      this.health -= this.stats.healthDecay * secondsPassed;
      //Check for round over condition
      if (this.health <= 0) {
        this.health = 0;
        this.isDead = true;
        this.changeAnimation('death');
        return;
      }
    }

    //Knock back physics engine
    if (Math.abs(this.knockBackVel) > 0.1) {
      //Apply active velocity
      this.x += this.knockBackVel * (deltaTime / 16.667);
      //Reduce force with friction
      this.knockBackVel *= this.knockBackFric;
    } else {
      this.knockBackVel = 0;
    }

    //Visual flash clock
    if (this.isFlashing) {
      this.flashTimer -= deltaTime;
      if (this.flashTimer <= 0) {
        this.isFlashing = false;
      }
    }

    //Action triggers state selection
    if (!this.isDead) {
      if (!this.inCombat) {
        this.changeAnimation('walk');
        //Calculate exact pixel change for this single frame
        const distMovedThisFrame = this.stats.moveSpeed * (deltaTime / 16.667);
        //Move player in world
        this.x += distMovedThisFrame;
        //Add distance traveled to game data
        GAME_DATA.totalDistanceTraveled += distMovedThisFrame;
      } else {
        if (this.state !== 'attack' && this.state !== 'takeDmg') {
          this.changeAnimation('idle');
        }
      }
    }

    //Keep standard timers ticking down
    if (!this.isDead) {
      this.attackTimer += deltaTime;
      if (this.stats.autoAttack) {
        if (this.attackTimer >= this.stats.attackInterval) {
          if (this.inCombat) {
            this.changeAnimation('attack');
          }
          this.attackTimer = 0;
        }
      }
    }

    //Advanced animation engine tick
    const config = this.animations[this.state];
    this.animTimer += deltaTime;

    if (this.animTimer >= config.speed) {
      this.animTimer = 0;
      if (this.currentFrame < config.maxFrames - 1) {
        this.currentFrame++;
        if (this.state === 'attack' && this.currentFrame === config.maxFrames - 1) {
          this.attack();
        }
      } else {
        //Reached final frame of current animation
        if (config.loop) {
          this.currentFrame = 0;
        } else {
          //Animation finished, figure out what to do next
          if (this.state === 'attack' || this.state === 'takeDmg') {
            this.state = this.inCombat ? 'idle' : 'walk';
            this.currentFrame = 0;
          } else if (this.state === 'death') {
            this.onRoundEnd();
          }
        }
      }
    }
  }

  canAttack() {
    return this.attackTimer >= this.stats.attackInterval && this.state !== 'attack' && this.state !== 'takeDmg';
  }

  startManualAttack() {
    if (!this.canAttack()) return false;

    this.changeAnimation('attack');
    this.attackTimer = 0;
    return true;
  }

  attack() {
    soundManager.play('swordSwing');
    //Anchor swipe pivot point
    const pivotX = this.x + this.width;
    const pivotY = this.y + this.height / 2;
    activeEffects.push(new SlashEffect(pivotX, pivotY, this.stats.attackRange));
    //Hit every enemy within attackRange, not just the closest one
    const targets = enemyManager.getEnemiesInRange(this);
    targets.forEach((target) => {
      //Deal damage and check if enemy is dead
      target.takeDamage(this, this.stats.meleeDamage);
      if (target.kind === 'skeleton') soundManager.play('skeletonHit');
    });
  }

  xpGain(amt) {
    if (this.isDead) return;
    this.xp += amt;
    let levelsGained = 0;
    while (this.xp >= this.nextXpLevel) {
      //Deduct the requirement to preserve overflow remainder xp
      this.xp -= this.nextXpLevel;
      //Increment level counter
      this.level++;
      levelsGained++;
      //scale the next level requirement
      this.nextXpLevel = Math.floor(this.nextXpLevel * this.xpScalar);
      //Display level up text on screen
      const spawnX = canvas.width / 2;
      const spawnY = canvas.height / 2 - 100;
      activeTexts.push(new FloatingTexts(spawnX, spawnY, 'LEVEL UP', 30, '#f1c40f'));
    }
    return levelsGained;
  }

  onRoundEnd() {
    setGameState('ROUND_END');
  }

  changeAnimation(newState) {
    if (this.state === 'death') return;
    if (this.state === 'takeDmg' && (newState === 'walk' || newState === 'idle')) return;
    if (this.state === 'attack' && (newState === 'walk' || newState === 'idle')) return;
    //Don't restart animation if its already running
    if (this.state === newState) return;

    this.state = newState;
    this.currentFrame = 0;
    this.animTimer = 0;

    const config = this.animations[this.state];
    if (this.state === 'attack' && config && config.maxFrames === 1) {
      this.attack();
    }
  }

  draw() {
    //Get settings for current animation
    const config = this.animations[this.state];
    //Horizontal pixel shift for sprite frame
    const cropX = this.currentFrame * this.frameWidth;
    const cropY = 0;
    const spriteContext = this.spriteContext;
    spriteContext.clearRect(0, 0, this.width, this.height);
    //Draw the specific frame onto a transparent surface
    spriteContext.drawImage(config.image, cropX, cropY, this.frameWidth, 32, 0, 0, this.width, this.height);

    //Draw circle above player indicating time to next strike
    if (!this.isDead) {
      //Position indicator above and behind player
      const circleX = this.x - 10;
      const circleY = this.y - 10;
      const radius = 6;
      //Calculate progress percentage
      const currentAttackInterval = this.stats.attackInterval;
      const progressPerc = Math.min(this.attackTimer / currentAttackInterval, 1);

      //Draw circle
      if (progressPerc > 0) {
        c.save();
        c.beginPath();
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + progressPerc * (Math.PI * 2);
        c.arc(circleX, circleY, radius, startAngle, endAngle);
        c.lineWidth = 6;
        c.strokeStyle = '#fff';
        c.stroke();
        c.restore();
      }
    }

    //Apply hit flash color change
    if (this.isFlashing && !this.isDead) {
      c.save();
      //Tint only the non-transparent pixels of the isolated sprite
      spriteContext.globalCompositeOperation = 'source-atop';
      spriteContext.fillStyle = 'rgba(231, 76, 60, 0.8)';
      spriteContext.fillRect(0, 0, this.width, this.height);
      spriteContext.globalCompositeOperation = 'source-over';
      c.restore();
    }

    c.drawImage(this.spriteCanvas, this.x, this.y);
  }
}
