// 计数器
class Counter {
  constructor(threshold, exec) {
    this.count = 0;
    this.threshold = threshold;
    this.exec = exec;
  }

  add() {
    this.count++;
    if (++this.count >= this.threshold) {
      this.exec();
      this.reset()
    }
  }

  reset() {
    this.count = 0;
  }
}

module.exports = Counter;