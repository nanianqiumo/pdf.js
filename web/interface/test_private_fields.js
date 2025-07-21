class TestPrivateFields {
  #privateField = "私有字段值";

  #privateCount = 0;

  constructor() {
    console.log("✅ 私有字段初始化成功");
  }

  getPrivateField() {
    return this.#privateField;
  }

  setPrivateField(value) {
    this.#privateField = value;
    this.#privateCount++;
  }

  getCount() {
    return this.#privateCount;
  }

  // 测试私有方法
  #privateMethod() {
    return "私有方法调用成功";
  }

  callPrivateMethod() {
    return this.#privateMethod();
  }
}
export { TestPrivateFields };
