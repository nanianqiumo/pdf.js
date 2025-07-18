/* Copyright 2023 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * 事件发射器基类
 * 提供事件注册、移除和触发的基本功能
 */
class EventEmitter {
  /**
   * @type {Object.<string, Function[]>} 存储事件监听器
   * @private
   */
  #eventListeners = {};

  /**
   * 添加事件监听器
   * @param {string} eventType - 事件类型
   * @param {Function} callback - 回调函数
   * @returns {EventEmitter} - 返回this用于链式调用
   */
  on(eventType, callback) {
    if (typeof callback !== "function") {
      throw new Error("监听器必须是一个函数");
    }

    if (!this.#eventListeners[eventType]) {
      this.#eventListeners[eventType] = [];
    }

    this.#eventListeners[eventType].push(callback);
    return this;
  }

  /**
   * 移除事件监听器
   * @param {string} eventType - 事件类型
   * @param {Function} [callback] - 回调函数，如果不提供则移除所有该类型的监听器
   * @returns {EventEmitter} - 返回this用于链式调用
   */
  off(eventType, callback) {
    if (!this.#eventListeners[eventType]) {
      return this;
    }

    if (!callback) {
      this.#eventListeners[eventType] = [];
    } else {
      this.#eventListeners[eventType] = this.#eventListeners[eventType].filter(
        listener => listener !== callback
      );
    }

    return this;
  }

  /**
   * 触发事件
   * @param {string} eventType - 事件类型
   * @param {*} data - 事件数据
   * @protected
   */
  _triggerEvent(eventType, data) {
    if (!this.#eventListeners[eventType]) {
      return;
    }

    this.#eventListeners[eventType].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`事件监听器执行错误 (${eventType}):`, error);
      }
    });
  }

  /**
   * 判断是否存在指定类型的事件监听器
   * @param {string} eventType - 事件类型
   * @returns {boolean} - 是否存在
   * @protected
   */
  _hasEventListeners(eventType) {
    return (
      !!this.#eventListeners[eventType] &&
      this.#eventListeners[eventType].length > 0
    );
  }

  /**
   * 获取所有事件类型
   * @returns {string[]} - 事件类型数组
   * @protected
   */
  _getEventTypes() {
    return Object.keys(this.#eventListeners);
  }

  /**
   * 清除所有事件监听器
   * @protected
   */
  _clearAllEventListeners() {
    this.#eventListeners = {};
  }
}

export { EventEmitter };
