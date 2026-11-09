class Bot {
  constructor(id, team) {
    this.id = id;
    this.team = team;
    this.x = team === 'blue' ? -400 : 400;
    this.y = 0;
    this.target = { x: 0, y: -2500 };
  }

  update() {
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 5) {
      this.x += (dx / dist) * 3;
      this.y += (dy / dist) * 3;
    }
  }
}

module.exports = { Bot };