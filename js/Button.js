class Button {
  constructor(x, y, width, height, text, active, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.color = color;
    this.isActive = active;
  }

  draw() {
    c.save();
    c.fillStyle = this.isActive ? this.color : '#828282';
    c.strokeStyle = this.isActive ? '#fff' : '#828282';
    c.lineWidth = 3;
    c.font = '35px Tiny5, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.beginPath();

    c.fillRect(this.x, this.y, this.width, this.height);
    c.roundRect(this.x, this.y, this.width, this.height, 4);
    c.stroke();
    c.fillStyle = this.isActive ? '#fff' : '#bcbcbc';
    c.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
    c.restore();
  }
}
