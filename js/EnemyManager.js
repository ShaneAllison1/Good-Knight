class EnemyManager {
  constructor() {
    this.enemies = [];
    this.spawnDistanceTracker = 0;
    this.nextSpawnThreshold = 450; //Spawn enemy every 400 pixels traveled
  }

  reset() {
    this.enemies = [];
    this.spawnDistanceTracker = 0;
  }

  //Procedurally generate enemies off screen right as the player moves
  update(deltaTime, player, fixedYLevel) {
    //Check all active enemies
    this.enemies.forEach((enemy) => enemy.update(deltaTime, player));
    //Cleanup dead enemies
    this.enemies = this.enemies.filter((enemy) => !enemy.isDead && enemy.x > player.x);
    //Prevent enemies from stacking on top of each other
    //First sort enemies by their x position from left to right
    this.enemies.sort((a, b) => a.x - b.x);
    //Define how close enemies are allowed to get to each other
    const minSeperation = 0;
    //Loop through sorted queue starinf from second enemy
    for (let i = 1; i < this.enemies.length; i++) {
      const currEnemy = this.enemies[i];
      const frontEnemy = this.enemies[i - 1];
      //Calculate distance between current enemy and the one in front of it
      const distBetween = currEnemy.x - (frontEnemy.x + frontEnemy.spacingWidth);
      //If they are closer then allowed, push second enemy back
      if (distBetween < minSeperation) {
        currEnemy.x = frontEnemy.x + frontEnemy.spacingWidth + minSeperation;
        if (currEnemy.vx) currEnemy.vx = 0;
      }
    }
    //Track player travel distance to trigger enemy spawn
    if (player.x > this.spawnDistanceTracker) {
      this.spawnDistanceTracker = player.x + this.nextSpawnThreshold;
      //Determine grouping of enemies 1 - 3
      const clusterSize = Math.random() * 3 + 1;
      //Chance to spawn elite enemy
      const baseEliteChance = 0.05;
      const distScalar = player.x * 0.00001;
      const threatLevel = 1 + GAME_DATA.totalDistanceTraveled * GAME_DATA.diffacultyScalingFactor;
      //Cap at 40%
      const currEliteChance = threatLevel > 2 ? Math.min(baseEliteChance + distScalar, 0.4) : 0;
      let spawnX = player.x + 800;
      for (let i = 0; i < clusterSize; i++) {
        const spawnRoll = Math.random();
        const type = spawnRoll < currEliteChance ? 'elite' : 'basic';
        const enemy = new Enemy(spawnX, 0, 'skeleton', type);
        enemy.y = fixedYLevel - enemy.height;
        this.enemies.push(enemy);
        spawnX += enemy.spacingWidth + minSeperation;
      }
    }
  }

  draw() {
    c.save();
    this.enemies.forEach((enemy) => enemy.draw());
    c.restore();
  }

  getClosestEnemy(player) {
    let closest = null;
    let minDist = Infinity;

    this.enemies.forEach((enemy) => {
      if (!enemy.isDead) {
        const dist = enemy.x - (player.x + player.width);
        if (dist >= 0 && dist < minDist && dist <= player.stats.attackRange) {
          minDist = dist;
          closest = enemy;
        }
      }
    });
    return closest;
  }

  //Return every living enemy within the player's attack range, closest first
  getEnemiesInRange(player) {
    return this.enemies
      .filter((enemy) => {
        if (enemy.isDead) return false;
        const dist = enemy.x - (player.x + player.width);
        return dist >= 0 && dist <= player.stats.attackRange;
      })
      .sort((a, b) => a.x - b.x);
  }
}
