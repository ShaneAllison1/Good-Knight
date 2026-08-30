const tileA = new Image();
tileA.src = './img/bg/ground1.png';
const tileB = new Image();
tileB.src = './img/bg/ground2.png';
const groundTiles = [tileA, tileB];

class ProceduralGround {
  constructor(floorYLevel) {
    this.floorY = floorYLevel;
    this.tileSize = 16 * 2;
    this.rows = 1;
  }

  gerDeterministicTileIndex(gridX, gridY) {
    //Bitwise hash formula
    let hash = (gridX * 73856093) ^ (gridY * 19349663);
    return Math.abs(hash) % groundTiles.length;
  }

  draw(cameraX, canvasWidth) {
    c.save();
    c.imageSmoothingEnabled = false;
    //Calculate start and ending columns visible on screen
    const startCol = Math.floor(cameraX / this.tileSize);
    const endCol = Math.ceil((cameraX + canvasWidth) / this.tileSize);
    //Loop across horizontal viewport columns
    for (let col = startCol; col <= endCol; col++) {
      //Loop down vertical rows
      for (let row = 0; row < this.rows; row++) {
        //Fetch random index
        const tileIndex = this.gerDeterministicTileIndex(col, row);
        const activeImage = groundTiles[tileIndex];
        //Only render if asset is fully loaded
        if (activeImage.complete && activeImage.width > 0) {
          const renderX = col * this.tileSize;
          //Stack down from Y anchor
          const renderY = this.floorY + row * this.tileSize;
          c.drawImage(activeImage, renderX, renderY, this.tileSize, this.tileSize);
        }
      }
    }
    c.restore();
  }
}
