class UpgradePopup {
  constructor() {
    this.hoveredNode = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.width = 200;
    this.height = 100;
  }

  update(mouseX, mouseY, hoveredNode) {
    this.mouseX = mouseX;
    this.mouseY = mouseY;
    this.hoveredNode = hoveredNode;
  }

  draw() {
    if (!this.hoveredNode) return;

    //Position the popup to the right and above mouse
    const x = this.mouseX - 100;
    const y = this.mouseY - 110;

    c.save();
    //Draw background panel
    c.beginPath();
    c.roundRect(x, y, this.width, this.height, 4);
    c.fillStyle = 'rgba(20, 24, 30, 0.95)';
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = '#fff';
    c.stroke();
    //Draw title
    c.fillStyle = '#fff';
    c.font = '18px Tiny5, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(this.hoveredNode.name, x + 100, y + 12);
    //Draw current level
    c.font = '16px Tiny5, monospace';
    if (this.hoveredNode.level === this.hoveredNode.maxLevel) {
      c.fillText(`MAX`, x + 100, y + 35);
    } else {
      c.fillText(`Lvl. ${this.hoveredNode.level} / ${this.hoveredNode.maxLevel}`, x + 100, y + 35);
    }
    //Draw description
    c.font = '20px Tiny5, monospace';
    c.fillText(this.hoveredNode.description, x + 100, y + 55);
    //Draw cost
    c.font = '16px Tiny5, monospace';
    if (this.hoveredNode.costType === 'gold') {
      c.drawImage(coinImg, x + 50, y + 71, 16, 16);
      c.fillText(`${GAME_DATA.gold} / ${this.hoveredNode.cost}`, x + 100, y + 80);
    } else if (this.hoveredNode.costType === 'gems') {
      c.drawImage(gemImg, x + 50, y + 71, 16, 16);
      c.fillText(`${GAME_DATA.gems} / ${this.hoveredNode.cost}`, x + 100, y + 80);
    } else if (this.hoveredNode.costType === 'shards') {
      c.drawImage(shardImg, x + 50, y + 71, 16, 16);
      c.fillText(`${GAME_DATA.shards} / ${this.hoveredNode.cost}`, x + 100, y + 80);
    }
    c.restore();
  }
}
