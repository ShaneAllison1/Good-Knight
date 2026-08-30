const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
canvas.width = 1280;
canvas.height = 720;

const soundManager = new SoundManager();

//Tiny5-Regular font
const tiny5Font = new FontFace('Tiny5', 'url(font/Tiny5-Regular.ttf)');
tiny5Font
  .load()
  .then((loadedFont) => {
    document.fonts.add(loadedFont);
  })
  .catch((error) => {
    console.log('Failed to load font: ', error);
  });

//Mouse functions
let mouse = { x: 0, y: 0 };
function mouseOverButton(btn) {
  if (
    mouse.x >= btn.x &&
    mouse.x <= btn.x + btn.width &&
    mouse.y >= btn.y &&
    mouse.y <= btn.y + btn.height &&
    btn.isActive
  )
    return true;
}

//Game data variables
let GAME_DATA = {
  gold: 0,
  gems: 0,
  shards: 0,
  xp: 0,
  totalDistanceTraveled: 0, //In pixels, persists across all runs
  diffacultyScalingFactor: 0.0001, // How fast the game gets harder per pixel traveled
};

let roundLoot = {
  gold: 0,
  gems: 0,
  shards: 0,
};

//Setup game states
const GAME_STATES = {
  START: 'START',
  UPGRADE: 'UPGRADE',
  PLAYING: 'PLAYING',
  ROUND_END: 'ROUND_END',
  SETTINGS: 'SETTINGS',
};
let currentState = 'START';
let activeMusic = null;

function setBackgroundMusic(musicName) {
  if (activeMusic === musicName) return;

  if (activeMusic) soundManager.stopMusic(activeMusic);
  soundManager.playMusic(musicName);
  activeMusic = musicName;
}

function setGameState(nextState) {
  currentState = nextState;
  if (nextState === 'PLAYING' || nextState === 'ROUND_END') {
    setBackgroundMusic('bgm');
  } else if (nextState === 'START' || nextState === 'UPGRADE') {
    setBackgroundMusic('menuMusic');
  }
}

setBackgroundMusic('menuMusic');

//Setup player instance
const knight = new Knight(canvas.width / 2, 356);
knight.recalculateStats(upgrades);

//Setup camera
const camera = new Camera(canvas.width, canvas.height);

//Setup enemy system
const enemyManager = new EnemyManager();

//Setup start screen buttons
const continueBtn = new Button(canvas.width / 2 - 175, canvas.height / 2, 350, 55, 'CONTINUE', false);
const newGameBtn = new Button(canvas.width / 2 - 175, canvas.height / 2 + 75, 350, 55, 'NEW GAME', true);
const settingsBtn = new Button(canvas.width / 2 - 175, canvas.height / 2 + 150, 350, 55, 'SETTINGS', true);
const quitBtn = new Button(canvas.width / 2 - 175, canvas.height / 2 + 225, 350, 55, 'QUIT', true);
let startScreenBtns = [continueBtn, newGameBtn, settingsBtn, quitBtn];

//Universal menu button
const backBtn = new Button(20, canvas.height - 75, 100, 55, 'BACK', true, '#0030cf');

//Setup round end buttons
const upgradesBtn = new Button(canvas.width / 2 - 100, canvas.height / 2 + 190, 200, 55, 'UPGRADES', true, '#fd673c');

//******START SCREEN******//
function drawStartScreen() {
  //Background color
  c.fillStyle = '#242424';
  c.fillRect(0, 0, canvas.width, canvas.height);

  //Setup font properties
  c.save();
  c.font = 'bold 180px Tiny5, monospace';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = '#047400';
  c.shadowColor = '#000';
  c.shadowBlur = 20;
  //Draw title
  c.fillText('GOOD KNIGHT', canvas.width / 2, canvas.height / 2 - 100);
  //Draw buttons on screen
  startScreenBtns.forEach((btn) => {
    btn.draw();
  });
  c.restore();
}

const SETTINGS_UI = {
  //Volume slider
  slider: { x: canvas.width / 2 - 175, y: 100, width: 350, height: 15, handleRadius: 18 },
  //Mute toggles
  musicBtn: new Button(canvas.width / 2 - 175, 200, 350, 55, 'MUTE MUSIC', true, '#047400'),
  sfxBtn: new Button(canvas.width / 2 - 175, 275, 350, 55, 'MUTE SFX', true, '#047400'),
};

function drawSettingsScreen() {
  //Background color
  c.fillStyle = '#242424';
  c.fillRect(0, 0, canvas.width, canvas.height);

  //Master volume label
  c.save();
  c.fillStyle = '#fff';
  c.font = '30px Tiny5, monospace';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('Master Volume', canvas.width / 2, 50);
  //Volume slider
  c.beginPath();
  c.roundRect(SETTINGS_UI.slider.x, SETTINGS_UI.slider.y, SETTINGS_UI.slider.width, SETTINGS_UI.slider.height, 4);
  c.fillstyle = '#047400';
  c.fill();
  //Draw filled volume bar
  const fillWidth = SETTINGS_UI.slider.width * soundManager.masterVolume;
  c.beginPath();
  c.roundRect(SETTINGS_UI.slider.x, SETTINGS_UI.slider.y, fillWidth, SETTINGS_UI.slider.height, 4);
  c.fillStyle = '#0030cf';
  c.fill();

  //Draw draggable handle
  const handleX = SETTINGS_UI.slider.x + fillWidth;
  const handleY = SETTINGS_UI.slider.y + SETTINGS_UI.slider.height / 2;
  c.beginPath();
  c.arc(handleX, handleY, SETTINGS_UI.slider.handleRadius, 0, Math.PI * 2);
  c.fillStyle = '#fff';
  c.fill();
  c.lineWidth = 1.5;
  c.strokeStyle = '#2c3e50';
  c.stroke();
  //Draw music and sfx toggles
  SETTINGS_UI.musicBtn.draw();
  SETTINGS_UI.sfxBtn.draw();
  c.restore();

  //Back button
  backBtn.draw();

  //Settings debug
  c.save();
  c.fillStyle = '#fff';
  c.font = '30px monospace';
  c.fillText(`Master: ${soundManager.masterVolume}`, 50, 100);
  c.fillText(`Music: ${soundManager.musicMuted}`, 50, 140);
  c.fillText(`SFX: ${soundManager.sfxMuted}`, 50, 180);
  c.restore();
}

//Setup upgrade screen buttons
const skillTreeBtn = new Button(50, 30, 200, 55, 'SKILL TREE', true, '#0030cf');
const perksBtn = new Button(265, 30, 200, 55, 'PERKS', false, '#0030cf');
const settingsUgBtn = new Button(canvas.width - 75, 30, 55, 55, '*', true, '#0030cf');
const newRunBtn = new Button(canvas.width - 220, canvas.height - 75, 200, 55, 'NEW RUN', true, '#0030cf');
let upgradeScreenBtns = [skillTreeBtn, perksBtn, settingsUgBtn, newRunBtn];
const upgradePopup = new UpgradePopup();

//******UPGRADE HANDLING******//
const NODE_SIZE = 55;

function isNodeInvisible(node) {
  //If no parents its a root node and always visible
  if (node.parents.length === 0) return true;
  //If at least one parent is purchased
  return node.parents.some((parentId) => upgrades[parentId]?.level > 0);
}

function updateUpgradeCost(node) {
  if (node.level >= node.maxLevel) return;

  //Exponential cost formula
  node.cost = Math.floor(node.baseCost * Math.pow(node.costMultiplier, node.level));
}

function drawUpgradeTree() {
  //Draw all connection lines first if both parent and child are visible
  Object.values(upgrades).forEach((node) => {
    if (!isNodeInvisible(node)) return;
    node.connections.forEach((childId) => {
      const childNode = upgrades[childId];
      if (childNode && isNodeInvisible(node)) {
        drawConnectionLine(node, childNode);
      }
    });
  });

  //Draw all nodes over the lines
  Object.values(upgrades).forEach((node) => {
    if (isNodeInvisible(node)) {
      drawNode(node);
    }
  });

  //Draw upgrade popup
  upgradePopup.draw();
}

function drawConnectionLine(parentNode, childNode) {
  c.save();
  c.beginPath();
  c.moveTo(parentNode.x, parentNode.y);
  c.lineTo(childNode.x, childNode.y);
  //Line style light up if purchased
  c.lineWidth = 4;
  c.strokeStyle = parentNode.purchased ? '#e1b12c' : '#444444';
  if (parentNode.purchased) c.stroke();
  c.restore();
}

function drawNode(node) {
  const width = NODE_SIZE;
  const height = NODE_SIZE;
  //Center bounding box over node x/y coordinates
  const x = node.x - width / 2;
  const y = node.y - height / 2;
  //determine affordability
  const costType = node.costType;
  let affordable;
  if (costType === 'gold') {
    affordable = GAME_DATA.gold >= node.cost;
  } else if (costType === 'gems') {
    affordable = GAME_DATA.gems >= node.cost;
  } else if (costType === 'shards') {
    affordable = GAME_DATA.shards >= node.cost;
  }
  //Draw background
  c.save();
  c.beginPath();
  c.roundRect(x, y, width, height, 4);
  c.fillStyle = '#000';
  c.fill();
  //Draw border
  c.lineWidth = 3;
  if (node.level < node.maxLevel) c.strokeStyle = affordable ? '#4cd137' : '#2f3640';
  else c.strokeStyle = '#ffc400';
  c.stroke();
  //Draw upgrade image
  if (node.image === heartImg) {
    c.drawImage(node.image, 0, 0, 16, 16, x + 2, y, 50, 50);
  } else {
    c.drawImage(node.image, x, y + 4, 51, 50);
  }
  c.restore();
}

//******UPGRADE SCREEN******//
function drawUpgradeScreen() {
  //Background color
  c.fillStyle = '#242424';
  c.fillRect(0, 0, canvas.width, canvas.height);

  //Draw buttons on screen
  upgradeScreenBtns.forEach((btn) => {
    newRunBtn.x = canvas.width - 220;
    newRunBtn.y = canvas.height - 75;
    btn.draw();
  });

  //Draw gold, gem & shard amount in top left
  drawGameInfo();

  //Draw menu button
  backBtn.text = 'MENU';
  backBtn.draw();

  //Draw the actual tree of upgrades
  drawUpgradeTree();
  showStats();
  showDifficulty();
}

//Game info
function drawGameInfo() {
  if (currentState === 'PLAYING') {
    //Draw player health, xp earned, and coins in top left
    c.save();
    c.fillStyle = '#fff';
    c.font = '24px Tiny5, monospace';
    c.fillText('HEALTH', 50, 50);
    c.restore();
    //Draw health bar that diminishes over time
    const barWidth = 250;
    const barHeight = 30;
    const barX = 50;
    let barY = 60;
    const healthPerc = Math.max(knight.health / knight.stats.maxHealth, 0);
    c.save();
    c.fillStyle = '#ff0000';
    c.strokeStyle = '#fff';
    c.beginPath();
    c.roundRect(barX, barY, barWidth, barHeight, 4);
    c.fillRect(barX, barY, barWidth * healthPerc, barHeight);
    c.stroke();
    c.font = '25px Tiny5, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#fff';
    c.fillText(`${Math.floor(knight.health)} / ${knight.stats.maxHealth}`, barX + barWidth / 2, barY + barHeight / 2);
    c.restore();
    c.save();
    //Draw xp bar that increasess over time
    const xpPerc = Math.max(knight.xp / knight.nextXpLevel, 0);
    const xpPercent = Math.floor(xpPerc * 100);
    c.save();
    c.fillStyle = '#fff';
    c.font = '24px Tiny5, monospace';
    c.fillText('XP', 50, 120);
    c.fillStyle = '#00a483';
    c.strokeStyle = '#fff';
    c.beginPath();
    barY = 130;
    c.roundRect(barX, barY, barWidth, barHeight, 4);
    c.fillRect(barX, barY, barWidth * xpPerc, barHeight);
    c.stroke();
    c.font = '25px Tiny5, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#fff';
    c.fillText(`${xpPercent}%`, barX + barWidth / 2, barY + barHeight / 2);
    c.restore();
  }
  //Draw gold amount in top left
  c.save();
  c.drawImage(coinImg, 50, 180, 24, 24);
  c.font = '25px Tiny5, monospace';
  c.fillStyle = '#fff';
  c.fillText(`x ${GAME_DATA.gold}`, 100, 200);
  //Draw gem amount if any
  if (GAME_DATA.gems > 0 || roundLoot.gems > 0) {
    c.drawImage(gemImg, 50, 220, 24, 24);
    c.fillText(`x ${GAME_DATA.gems}`, 100, 240);
  }
  //Draw shard total if any
  if (GAME_DATA.shards > 0 || roundLoot.shards > 0) {
    c.drawImage(shardImg, 50, 260, 24, 24);
    c.fillText(`x ${GAME_DATA.shards}`, 100, 280);
  }
  c.restore();
}

//Stat debugging
function showStats() {
  c.save();
  c.font = '20px monospace';
  c.fillStyle = '#fff';
  let startX = 1000;
  let startY = 100;
  const lineSpacing = 25;
  Object.entries(knight.stats).forEach(([key, value]) => {
    const text = `${key}: ${value}`;
    c.fillText(text, startX, startY);
    startY += lineSpacing;
  });
  c.restore();
}

//Difficulty debugging
function showDifficulty() {
  c.save();
  c.fillStyle = '#fff';
  c.font = '20px monospace';
  //Pixels to meters
  const metersTraveled = Math.floor(GAME_DATA.totalDistanceTraveled / 10);
  c.fillText(`Distance: ${metersTraveled}`, 1000, canvas.height - 200);
  //Display active threat factor
  const currentMultiplier = 1 + GAME_DATA.totalDistanceTraveled * GAME_DATA.diffacultyScalingFactor;
  c.fillText(`Threat level: ${currentMultiplier.toFixed(2)}`, 1000, canvas.height - 150);
  c.restore();
}

//******GAME SCREEN******//
let lastTime = performance.now();
let activeLoot = [];
let activeTexts = [];
let activeEffects = [];
const FLOOR_Y = 420;
const proceduralGround = new ProceduralGround(FLOOR_Y);
const background = new ParallaxBackground(canvas.width, FLOOR_Y);
function drawGameScreen(currentTime) {
  let deltaTime = Math.min(currentTime - lastTime, 50);
  lastTime = currentTime;
  // //Background color
  c.fillStyle = '#000';
  c.fillRect(0, 0, canvas.width, canvas.height);

  //Combat manager
  if (!knight.isDead) {
    const imminentEnemy = enemyManager.getClosestEnemy(knight);
    const stopDist = 5; //Leave a small gap between the knight and enemy

    if (imminentEnemy && imminentEnemy.x - (knight.x + knight.width) <= stopDist) {
      knight.inCombat = true;
    } else {
      knight.inCombat = false; //Release lock if enemy dies
    }
  }

  //Update player
  knight.update(deltaTime);

  //Update enemies and spawn new ones
  enemyManager.update(deltaTime, knight, FLOOR_Y);

  //Coin physics lifecycle
  activeLoot.forEach((loot) => loot.update(deltaTime));
  activeLoot = activeLoot.filter((loot) => !loot.isDead);

  //Update floating texts to the screen
  activeTexts.forEach((txt) => txt.update(deltaTime));
  activeTexts = activeTexts.filter((txt) => !txt.isDead);

  //Update active effects
  activeEffects.forEach((fx) => fx.update(deltaTime));
  activeEffects = activeEffects.filter((fx) => !fx.isDead);

  //Update camera target tracking
  camera.update(knight.x);

  background.draw(camera.x);

  //Render scrolling world objects
  camera.apply();
  // drawFloorGrid(camera.x);
  proceduralGround.draw(camera.x, canvas.width);
  knight.draw();
  enemyManager.draw();
  activeLoot.forEach((loot) => loot.draw());
  activeEffects.forEach((fx) => fx.draw());
  camera.restore(); //Everything below does not scroll

  activeTexts.forEach((txt) => txt.draw());

  //Draw game info in to left
  drawGameInfo();
  //Stats on the right
  showStats();
  showDifficulty();
}

//Reset player stats for next round
function startNewRound(player) {
  enemyManager.reset();
  player.isDead = false;
  player.inCombat = false;
  player.x = canvas.width / 2;
  player.health = player.stats.maxHealth;
  player.attackTimer = 0;
  player.state = 'walk';
  player.currentFrame = 0;
  player.animTimer = 0;
  camera.update(player.x);
  roundLoot.gold = 0;
  roundLoot.gems = 0;
  activeLoot = [];
  activeTexts = [];
  activeEffects = [];
  lastTime = performance.now();
  setGameState('PLAYING');
}

//******ROUND_END SCREEN******//
function drawRoundEndScreen() {
  //Background color
  c.fillStyle = 'rgba(24, 24, 24, 0.5)';
  c.fillRect(0, 0, canvas.width, canvas.height);

  //Draw DEFEATED on screen
  c.save();
  c.font = 'Bold 80px Tiny5, monospace';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = '#fff';
  c.shadowColor = '#000';
  c.shadowBlur = 20;
  c.fillText('DEFEATED', canvas.width / 2, 200);
  c.restore();

  //Draw loot collected box
  c.save();
  c.strokeStyle = '#fff';
  c.beginPath();
  c.roundRect(canvas.width / 2 - 150, 300, 300, 200, 4);
  c.stroke();
  c.font = 'Bold 24px Tiny5, monospace';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = '#fff';
  c.shadowColor = '#000';
  c.shadowBlur = 5;
  c.fillText('Loot Collected:', canvas.width / 2, 317);
  Object.values(roundLoot).forEach((item) => {
    c.drawImage(coinImg, canvas.width / 2 - 50, 340, 24, 24);
    c.fillText(` x ${roundLoot.gold}`, canvas.width / 2, 350);
  });
  c.restore();

  //Draw bottom screen buttons
  upgradesBtn.draw();
  newRunBtn.x = canvas.width / 2 - 100;
  newRunBtn.y = canvas.height / 2 + 260;
  newRunBtn.draw();
}

//******ANIMATION LOOP******//
function animate(currentTime) {
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, canvas.width, canvas.height);
  //Draw screen based on game state
  if (currentState === 'START') {
    drawStartScreen();
  } else if (currentState === 'UPGRADE') {
    drawUpgradeScreen();
  } else if (currentState === 'PLAYING') {
    drawGameScreen(currentTime);
  } else if (currentState === 'ROUND_END') {
    drawGameScreen(currentTime);
    drawRoundEndScreen();
  } else if (currentState === 'SETTINGS') {
    drawSettingsScreen();
  }

  requestAnimationFrame(animate);
}

animate();

//******EVENT LISTENERS******//
let isDraggingVol = false;
//Chaeck if dragging volume slider
canvas.addEventListener('mousedown', (e) => {
  if (currentState !== 'SETTINGS') return;

  const mouseX = e.offsetX;
  const mouseY = e.offsetY;
  const sliderCenterY = SETTINGS_UI.slider.y + SETTINGS_UI.slider.height / 2;
  if (
    mouseX >= SETTINGS_UI.slider.x &&
    mouseX <= SETTINGS_UI.slider.x + SETTINGS_UI.slider.width &&
    Math.abs(mouseY - sliderCenterY) <= 15
  ) {
    isDraggingVol = true;
    updateVolFromMouse(mouseX);
  }
});

canvas.addEventListener('mousemove', (e) => {
  mouse.x = e.offsetX;
  mouse.y = e.offsetY;

  //Check for volume slider
  if (currentState === 'SETTINGS' && isDraggingVol) {
    updateVolFromMouse(e.offsetX);
  }

  if (currentState === 'UPGRADE') {
    let activeNode = null;
    Object.values(upgrades).forEach((node) => {
      if (!isNodeInvisible(node)) return;
      const minX = node.x - NODE_SIZE / 2;
      const maxX = node.x + NODE_SIZE / 2;
      const minY = node.y - NODE_SIZE / 2;
      const maxY = node.y + NODE_SIZE / 2;
      if (mouse.x >= minX && mouse.x <= maxX && mouse.y >= minY && mouse.y <= maxY) {
        activeNode = node;
      }
    });
    upgradePopup.update(mouse.x, mouse.y, activeNode);
  }

  if (currentState === 'PLAYING') {
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    for (let i = activeLoot.length - 1; i >= 0; i--) {
      const loot = activeLoot[i];
      const dist = Math.hypot(worldMouseX - loot.x, worldMouseY - loot.y);
      const mousePickupRange = loot.radius + 15;
      if (dist < mousePickupRange) {
        if (loot.type === 'coin') {
          soundManager.play('coinPickup');
          GAME_DATA.gold += 1 * knight.stats.cursorLootMult;
          roundLoot.gold += 1 * knight.stats.cursorLootMult;
        } else if (loot.type === 'gem') {
          soundManager.play('gemPickup');
          GAME_DATA.gems += 1 * knight.stats.cursorLootMult;
          roundLoot.gems += 1 * knight.stats.cursorLootMult;
        } else if (loot.type === 'shard') {
          soundManager.play('shardPickup');
          GAME_DATA.shards += 1;
          roundLoot.shards += 1;
        }
        activeLoot.splice(i, 1);
      }
    }
  }
});

canvas.addEventListener('mouseup', (e) => {
  //Release tracking constraints on click lift
  isDraggingVol = false;
});

canvas.addEventListener('click', (e) => {
  //NEW GAME
  if (currentState === 'START' && mouseOverButton(newGameBtn)) {
    soundManager.play('click');
    setGameState('UPGRADE');
  }
  //SETTINGS
  if (currentState === 'START' && mouseOverButton(settingsBtn)) {
    soundManager.play('click');
    setGameState('SETTINGS');
  }
  //QUIT
  if (currentState === 'START' && mouseOverButton(quitBtn)) {
    //attempt to close window
    window.close();
    //Fallback if annot close
    setTimeout(() => {
      alert('Cannot close tab.');
    }, 100);
  }
  if (currentState === 'UPGRADE') {
    if (mouseOverButton(newRunBtn)) {
      soundManager.play('click');
      lastTime = performance.now();
      startNewRound(knight);
    }
    if (mouseOverButton(settingsUgBtn)) {
      soundManager.play('click');
      setGameState('SETTINGS');
    }
    if (mouseOverButton(backBtn)) {
      soundManager.play('click');
      setGameState('START');
    }
  }
  if (currentState === 'ROUND_END' && mouseOverButton(newRunBtn)) {
    soundManager.play('click');
    lastTime = performance.now();
    startNewRound(knight);
  } else if (currentState === 'ROUND_END' && mouseOverButton(upgradesBtn)) {
    soundManager.play('click');
    setGameState('UPGRADE');
  }
  if (currentState === 'SETTINGS') {
    if (mouseOverButton(SETTINGS_UI.musicBtn)) {
      soundManager.play('click');
      soundManager.toggleMusicMute();
    }
    if (mouseOverButton(SETTINGS_UI.sfxBtn)) {
      if (soundManager.sfxMuted) soundManager.play('click');
      soundManager.toggleSFXMute();
    }
    if (mouseOverButton(backBtn)) {
      soundManager.play('click');
      setGameState('START');
    }
  }

  //Click to attack until upgrade purchased
  if (currentState === 'PLAYING') {
    if (knight && !knight.isDead) {
      //if upgrade not purchased
      if (!knight.stats.autoAttack) {
        knight.startManualAttack();
        return;
      }
    }
  }

  //Upgrade nodes
  Object.values(upgrades).forEach((node) => {
    if (!isNodeInvisible(node)) return;
    const minX = node.x - NODE_SIZE / 2;
    const maxX = node.x + NODE_SIZE / 2;
    const minY = node.y - NODE_SIZE / 2;
    const maxY = node.y + NODE_SIZE / 2;
    if (mouse.x >= minX && mouse.x <= maxX && mouse.y >= minY && mouse.y <= maxY) {
      //If already bought
      if (node.level === node.maxLevel) {
        return;
      }
      //If cant afford
      if (node.costType === 'gold' && GAME_DATA.gold < node.cost) {
        return;
      }
      if (node.costType === 'gems' && GAME_DATA.gems < node.cost) {
        return;
      }
      if (node.costType === 'shards' && GAME_DATA.shards < node.cost) {
        return;
      }
      //if not purchased and can afford
      if (node.costType === 'gold') {
        GAME_DATA.gold -= node.cost;
      } else if (node.costType === 'gems') {
        GAME_DATA.gems -= node.cost;
      } else if (node.costType === 'shards') {
        GAME_DATA.shards -= node.cost;
      }
      soundManager.play('buyUpgrade');
      node.purchased = true;
      node.level++;
      updateUpgradeCost(node);
      //Update player with new stats
      knight.recalculateStats(upgrades);
      drawUpgradeTree();
    }
  });
});

function updateVolFromMouse(mouseX) {
  //Pixel shif from tracking start
  const currentWidthOffset = mouseX - SETTINGS_UI.slider.x;
  const calcPerc = currentWidthOffset / SETTINGS_UI.slider.width;
  //Save changes into sound manager
  soundManager.setMasterVolume(calcPerc);
}
