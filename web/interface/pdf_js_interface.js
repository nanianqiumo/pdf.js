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

// 导入消息类型常量和事件发射器基类
import { EventEmitter } from "./event_emitter.js";
import { MessageType } from "./message_type.js";

/**
 * PDFJSInterface类
 * 用于外部应用与嵌入的PDF.js查看器进行通信
 */
class PDFJSInterface extends EventEmitter {
  /**
   * 存储实例映射，用于实现单例模式
   * @type {WeakMap<HTMLIFrameElement, PDFJSInterface>}
   * @private
   * @static
   */
  static #instances = new WeakMap();

  /**
   * 获取或创建PDFJSInterface实例
   * @param {HTMLIFrameElement|string} iframe - PDF.js iframe元素或其ID
   * @returns {PDFJSInterface} 接口实例
   * @static
   */
  static getInstance(iframe) {
    // 如果传入的是ID，先获取DOM元素
    let iframeElement;
    if (typeof iframe === "string") {
      iframeElement = document.getElementById(iframe);
      if (!iframeElement) {
        throw new Error(`找不到ID为 ${iframe} 的iframe元素`);
      }
    } else if (iframe instanceof HTMLIFrameElement) {
      iframeElement = iframe;
    } else {
      throw new Error("需要提供有效的iframe元素或其ID");
    }

    // 检查是否已有实例
    if (this.#instances.has(iframeElement)) {
      const existingInstance = this.#instances.get(iframeElement);
      console.log("PDFJSInterface: 使用现有实例");
      return existingInstance;
    }

    console.log("PDFJSInterface: 创建新实例");
    // 创建新实例
    const instance = new PDFJSInterface(iframeElement);
    this.#instances.set(iframeElement, instance);
    return instance;
  }

  /**
   * @type {HTMLIFrameElement} PDF.js iframe元素
   */
  #iframe = null;

  /**
   * @type {Function} 准备就绪的回调函数
   */
  #onReadyCallback = null;

  /**
   * @type {boolean} PDF.js查看器是否已准备就绪
   */
  #isReady = false;

  /**
   * @type {Promise|null} 表示准备就绪的Promise
   */
  #readyPromise = null;

  /**
   * @type {Map<string, {
   *   resolve: Function,
   *   reject: Function,
   *   timeoutId: number
   * }>} 存储待处理的请求
   */
  #pendingRequests = new Map();

  /**
   * @type {Function} 绑定后的消息处理函数引用
   * @private
   */
  #boundMessageHandler = null;

  /**
   * @type {Function} 绑定后的iframe加载事件处理函数引用
   * @private
   */
  #boundIframeLoadHandler = null;

  /**
   * @type {number|null} 重新连接尝试的定时器ID
   */
  #reconnectTimerId = null;

  /**
   * 构造函数
   * @param {HTMLIFrameElement|string} iframe - PDF.js iframe元素或其ID
   * @private - 应该使用静态的getInstance方法获取实例，而不是直接实例化
   */
  constructor(iframe) {
    super();

    if (typeof iframe === "string") {
      this.#iframe = document.getElementById(iframe);
      if (!this.#iframe) {
        throw new Error(`找不到ID为 ${iframe} 的iframe元素`);
      }
    } else if (iframe instanceof HTMLIFrameElement) {
      this.#iframe = iframe;
    } else {
      throw new Error("需要提供有效的iframe元素或其ID");
    }

    // 保存绑定后的函数引用，以便之后可以移除
    this.#boundMessageHandler = this.#handleMessage.bind(this);

    // 设置消息监听器
    window.addEventListener("message", this.#boundMessageHandler);

    // 创建并保存iframe加载事件处理函数
    this.#boundIframeLoadHandler = () => {
      console.log("PDFJSInterface: iframe加载完成, 重置ready状态");
      // 每当iframe重新加载，我们都应该重置ready状态并清除任何进行中的readyPromise
      this.#isReady = false;
      this.#readyPromise = null;
      this.#reconnectAttempts = 0; // 重置重连尝试计数
      // 页面刷新时不需要立即尝试重连，等待正常的消息通信建立
      // 只在超时或请求失败时才触发重连
    };

    // 监听iframe的load事件，用于在iframe重新加载时重置状态
    this.#iframe.addEventListener("load", this.#boundIframeLoadHandler);
  }

  /**
   * 等待PDF.js查看器准备就绪
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<void>}
   */
  ready(timeout = 30000) {
    // 增加默认超时时间为30秒
    if (this.#isReady) {
      return Promise.resolve();
    }

    // 如果已经有一个等待中的Promise，直接返回它
    if (this.#readyPromise) {
      return this.#readyPromise;
    }

    console.log(`PDFJSInterface: 等待查看器准备就绪，超时时间: ${timeout}ms`);

    // 创建新的Promise并存储它
    this.#readyPromise = new Promise((resolve, reject) => {
      this.#onReadyCallback = resolve;

      // 设置超时
      const timeoutId = setTimeout(() => {
        if (!this.#isReady) {
          console.error(`PDFJSInterface: 查看器准备就绪超时(${timeout}ms)`);
          this.#onReadyCallback = null;
          this.#readyPromise = null;

          // 只有在iframe已经完全加载后才尝试重连
          if (this.#iframe && this.#iframe.contentWindow) {
            console.warn("PDFJSInterface: 查看器准备就绪超时，尝试重新连接...");
            this.#attemptReconnect();
          }

          reject(new Error("等待PDF.js查看器准备就绪超时"));
        }
      }, timeout);

      // 一次性处理程序
      const handler = () => {
        clearTimeout(timeoutId);
        this.#isReady = true;
        console.log("PDFJSInterface: 查看器已经准备就绪");
        this.off(MessageType.PDFJS_INTERFACE_READY, handler); // 移除监听器
        resolve();
        this.#onReadyCallback = null;
        this.#readyPromise = null;
      };

      // 如果监听器已经接收到ready事件，立即解析
      this.on(MessageType.PDFJS_INTERFACE_READY, handler);

      // 如果已经准备就绪，立即触发处理程序
      if (this.#isReady) {
        handler();
      }
    });

    return this.#readyPromise;
  }

  /**
   * @type {number} 重连尝试次数
   */
  #reconnectAttempts = 0;

  /**
   * @type {number} 最大重连尝试次数
   */
  #maxReconnectAttempts = 3;

  /**
   * @type {number} 重连延迟时间(ms)
   */
  #reconnectDelay = 2000;

  /**
   * @type {boolean} 是否正在进行重连尝试
   */
  #isReconnecting = false;

  /**
   * 处理来自PDF.js查看器的消息
   * @param {MessageEvent} event - 消息事件
   * @private
   */
  #handleMessage(event) {
    // 确保消息来自我们的iframe
    if (event.source !== this.#iframe.contentWindow) {
      return;
    }

    const { type, data, requestId } = event.data || {};

    // 调试消息
    console.log("PDFJSInterface 收到消息:", type, data);

    // 收到消息表示连接正常，重置重连计数
    this.#reconnectAttempts = 0;
    this.#isReconnecting = false;

    // 处理响应
    if (requestId && this.#pendingRequests.has(requestId)) {
      const request = this.#pendingRequests.get(requestId);
      clearTimeout(request.timeoutId);
      this.#pendingRequests.delete(requestId);

      if (type.endsWith(".error")) {
        request.reject(new Error(data?.message || "未知错误"));
      } else {
        request.resolve(data);
      }
      return;
    }

    // 处理事件，但排除PDFJS_INTERFACE_READY事件的常规处理(将在下面特殊处理)
    if (type && type !== MessageType.PDFJS_INTERFACE_READY) {
      this._triggerEvent(type, data);
    }

    // 特殊处理ready事件
    if (type === MessageType.PDFJS_INTERFACE_READY) {
      // 检查是否之前已设置为ready，避免重复触发
      if (!this.#isReady) {
        this.#isReady = true;
        console.log("PDFJSInterface: 收到ready事件，设置#isReady=true");
        // 触发事件，确保只触发一次
        this._triggerEvent(MessageType.PDFJS_INTERFACE_READY, {});
      } else {
        console.log("PDFJSInterface: 重复收到ready事件，已忽略");
      }
    }
  }

  /**
   * 尝试重新连接
   * 仅在确实需要重连时调用此方法（如请求超时或手动触发重连）
   * @private
   */
  #attemptReconnect() {
    // 如果已经在重连或达到最大尝试次数，则返回
    if (
      this.#isReconnecting ||
      this.#reconnectAttempts >= this.#maxReconnectAttempts
    ) {
      return;
    }

    // 如果iframe还没有加载完成，不要尝试重连
    if (!this.#iframe || !this.#iframe.contentWindow) {
      console.log("PDFJSInterface: iframe尚未准备好，跳过重连");
      return;
    }

    this.#isReconnecting = true;
    this.#reconnectAttempts++;

    console.log(
      `PDFJSInterface: 尝试重新连接 (${this.#reconnectAttempts}/${this.#maxReconnectAttempts})...`
    );

    // 发送ping以检查查看器是否响应
    this.ping()
      .then(() => {
        console.log("PDFJSInterface: 重新连接成功");
        this.#isReconnecting = false;

        // 触发重连成功事件
        this._triggerEvent("reconnect_success", {
          attempts: this.#reconnectAttempts,
        });

        // 如果查看器已准备就绪，触发ready事件
        if (!this.#isReady) {
          this.#sendMessage(MessageType.CHECK_READY)
            .then(isReady => {
              if (isReady) {
                this.#isReady = true;
                this._triggerEvent(MessageType.PDFJS_INTERFACE_READY, {});
                if (this.#onReadyCallback) {
                  this.#onReadyCallback();
                  this.#onReadyCallback = null;
                }
              }
            })
            .catch(error => {
              console.error("PDFJSInterface: 检查查看器是否就绪失败", error);
            });
        }
      })
      .catch(error => {
        console.error("PDFJSInterface: 重新连接失败", error);
        this.#isReconnecting = false;

        // 如果未达到最大尝试次数，延迟后再次尝试
        if (this.#reconnectAttempts < this.#maxReconnectAttempts) {
          // 先清除可能存在的旧定时器
          if (this.#reconnectTimerId !== null) {
            clearTimeout(this.#reconnectTimerId);
          }
          // 保存新定时器ID
          this.#reconnectTimerId = setTimeout(() => {
            this.#reconnectTimerId = null;
            this.#attemptReconnect();
          }, this.#reconnectDelay);
        } else {
          console.error("PDFJSInterface: 已达到最大重连尝试次数，放弃重连");
          this._triggerEvent("reconnect_attempts_exhausted", {
            attempts: this.#reconnectAttempts,
            maxAttempts: this.#maxReconnectAttempts,
          });
        }
      });
  }

  /**
   * 向PDF.js查看器发送消息
   * @param {string} type - 消息类型
   * @param {Object} data - 消息数据
   * @param {number} timeout - 超时时间（毫秒）
   * @param {boolean} [ensureReady=true] - 是否确保查看器已准备就绪
   * @returns {Promise<any>} - 响应数据
   * @private
   */
  async #sendMessage(type, data = null, timeout = 5000, ensureReady = true) {
    // 对于特殊消息类型（如ping和check_ready），不需要确保就绪
    if (
      ensureReady &&
      type !== MessageType.PING &&
      type !== MessageType.CHECK_READY
    ) {
      // 如果已经就绪，直接继续
      if (!this.#isReady) {
        try {
          await this.ready();
        } catch (error) {
          // 如果ready失败但iframe存在，仍然尝试发送消息
          if (!this.#iframe || !this.#iframe.contentWindow) {
            throw error;
          }
          console.warn(`PDFJSInterface: ready失败但仍继续发送消息[${type}]`);
        }
      }
    }

    return new Promise((resolve, reject) => {
      if (!this.#iframe.contentWindow) {
        reject(new Error("iframe尚未初始化"));
        return;
      }

      const requestId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 设置超时
      const timeoutId = setTimeout(() => {
        if (this.#pendingRequests.has(requestId)) {
          this.#pendingRequests.delete(requestId);
          const timeoutError = new Error(`请求超时: ${type}`);
          reject(timeoutError);

          // 请求超时可能意味着连接问题，尝试重连
          // 但对ping请求本身不触发重连，以避免无限循环
          // 同时确保避免频繁的重连尝试
          if (
            type !== MessageType.PING &&
            type !== MessageType.CHECK_READY &&
            !this.#isReconnecting &&
            this.#reconnectAttempts < this.#maxReconnectAttempts
          ) {
            console.warn(`PDFJSInterface: 请求[${type}]超时，尝试重新连接...`);
            this.#attemptReconnect();
          }
        }
      }, timeout);

      // 存储待处理的请求
      this.#pendingRequests.set(requestId, { resolve, reject, timeoutId });

      // 发送消息
      this.#iframe.contentWindow.postMessage(
        { type, data, requestId },
        "*" // 考虑安全性，可以设置为具体的PDF.js查看器URL
      );
    });
  }

  /**
   * 获取所有高亮
   * @returns {Promise<Array>} - 高亮数组
   */
  async getHighlights() {
    return this.#sendMessage(MessageType.GET_HIGHLIGHTS);
  }

  /**
   * 清除所有高亮
   * @returns {Promise<Object>} - 操作结果
   */
  async clearHighlights() {
    return this.#sendMessage(MessageType.CLEAR_HIGHLIGHTS);
  }

  /**
   * 清除指定ID的高亮
   * @param {string} id - 高亮ID
   * @returns {Promise<Object>} - 操作结果
   */
  async clearHighlight(id) {
    return this.#sendMessage(MessageType.CLEAR_HIGHLIGHT, { id });
  }

  /**
   * 获取所有页面的文本
   * @returns {Promise<Array<{page: number, text: string}>>} - 页面文本数组
   */
  async getAllText() {
    return this.#sendMessage(MessageType.GET_TEXT);
  }

  /**
   * 获取指定页面的文本
   * @param {number} page - 页码（从1开始）
   * @returns {Promise<{page: number, text: string}>} - 页面文本
   */
  async getPageText(page) {
    return this.#sendMessage(MessageType.GET_PAGE_TEXT, { page });
  }

  /**
   * 获取当前页码
   * @returns {Promise<number>} - 当前页码（从1开始）
   */
  async getCurrentPage() {
    return this.#sendMessage(MessageType.GET_CURRENT_PAGE);
  }

  /**
   * 获取总页数
   * @returns {Promise<number>} - 总页数
   */
  async getPageCount() {
    return this.#sendMessage(MessageType.GET_PAGE_COUNT);
  }

  /**
   * 跳转到指定页面
   * @param {number} pageNumber - 页码（从1开始）
   * @returns {Promise<Object>} - 操作结果
   */
  async goToPage(pageNumber) {
    return this.#sendMessage(MessageType.GO_TO_PAGE, { pageNumber });
  }

  /**
   * 设置文本高亮
   * @param {string} text - 要高亮的文本
   * @param {Object} options - 高亮选项
   * @param {string} [options.color] - 高亮颜色，如 #FFFF00
   * @returns {Promise<Object>} - 操作结果
   */
  async setTextHighlight(text, options = {}) {
    return this.#sendMessage(MessageType.SET_TEXT_HIGHLIGHT, { text, options });
  }

  /**
   * 清除文本高亮
   * @returns {Promise<Object>} - 操作结果
   */
  async clearTextHighlight() {
    return this.#sendMessage(MessageType.CLEAR_TEXT_HIGHLIGHT);
  }

  /**
   * 查找文本
   * @param {string} text - 要查找的文本
   * @param {Object} options - 查找选项
   * @param {string} [options.direction] - 查找方向，forward 或 backward
   * @param {boolean} [options.caseSensitive] - 是否区分大小写
   * @param {boolean} [options.wholeWord] - 是否完全匹配单词
   * @returns {Promise<{found: boolean, page?: number}>} - 查找结果
   */
  async findText(text, options = {}) {
    return this.#sendMessage(MessageType.FIND_TEXT, { text, options });
  }

  /**
   * 获取文档信息
   * @returns {Promise<Object>} - 文档信息
   */
  async getDocumentInfo() {
    return this.#sendMessage(MessageType.GET_DOCUMENT_INFO);
  }

  /**
   * 获取文档大纲
   * @returns {Promise<Array>} - 大纲数组
   */
  async getDocumentOutline() {
    return this.#sendMessage(MessageType.GET_DOCUMENT_OUTLINE);
  }

  /**
   * 获取注释
   * @param {number} pageNumber - 页码（从1开始）
   * @returns {Promise<Array>} - 注释数组
   */
  async getAnnotations(pageNumber) {
    return this.#sendMessage(MessageType.GET_ANNOTATIONS, { pageNumber });
  }

  /**
   * 添加注释
   * @param {Object} annotation - 注释对象
   * @returns {Promise<Object>} - 操作结果
   */
  async addAnnotation(annotation) {
    return this.#sendMessage(MessageType.ADD_ANNOTATION, { annotation });
  }

  /**
   * 更新注释
   * @param {Object} annotation - 注释对象
   * @returns {Promise<Object>} - 操作结果
   */
  async updateAnnotation(annotation) {
    return this.#sendMessage(MessageType.UPDATE_ANNOTATION, { annotation });
  }

  /**
   * 删除注释
   * @param {string} annotationId - 注释ID
   * @returns {Promise<Object>} - 操作结果
   */
  async deleteAnnotation(annotationId) {
    return this.#sendMessage(MessageType.DELETE_ANNOTATION, { annotationId });
  }

  /**
   * 设置缩放
   * @param {string|number} scale - 缩放值，可以是数字（如 1.5）或字符串
   *                               （如'page-fit', 'page-width', 'auto'等）
   * @returns {Promise<Object>} - 操作结果
   */
  async setZoom(scale) {
    return this.#sendMessage(MessageType.SET_ZOOM, { scale });
  }

  /**
   * 旋转页面
   * @param {number} rotation - 旋转角度（90, 180, 270, -90, -180, -270）
   * @returns {Promise<Object>} - 操作结果
   */
  async rotatePages(rotation) {
    return this.#sendMessage(MessageType.ROTATE_PAGES, { rotation });
  }

  /**
   * 下载PDF
   * @returns {Promise<Object>} - 操作结果
   */
  async downloadPdf() {
    return this.#sendMessage(MessageType.DOWNLOAD_PDF);
  }

  /**
   * 打印PDF
   * @returns {Promise<Object>} - 操作结果
   */
  async printPdf() {
    return this.#sendMessage(MessageType.PRINT_PDF);
  }

  /**
   * 检测PDF.js查看器是否响应
   * @returns {Promise<Object>} - 操作结果
   */
  async ping() {
    return this.#sendMessage(MessageType.PING, null, 5000, false);
  }

  /**
   * 导航到目标位置
   * @param {Object|string|Array} dest - 目标位置描述
   * @returns {Promise<Object>} - 操作结果
   */
  async navigateTo(dest) {
    return this.#sendMessage(MessageType.NAVIGATE_TO, { dest });
  }

  /**
   * 手动尝试重新连接查看器
   * 在连接似乎丢失时可以由外部代码调用
   * @returns {Promise<boolean>} - 重连是否成功
   */
  async reconnect() {
    // 如果已经准备就绪，不需要重连
    if (this.#isReady) {
      console.log("PDFJSInterface: 接口已就绪，无需重连");
      return true;
    }

    // 如果正在重连，直接返回
    if (this.#isReconnecting) {
      console.log("PDFJSInterface: 正在重连中，请等待");
      return false;
    }

    // 如果iframe未加载，无法重连
    if (!this.#iframe || !this.#iframe.contentWindow) {
      console.error("PDFJSInterface: iframe尚未加载完成，无法重连");
      return false;
    }

    console.log("PDFJSInterface: 手动触发重新连接...");

    // 重置重连计数和状态，以便重新开始重连过程
    this.#reconnectAttempts = 0;
    this.#isReconnecting = false;

    // 触发重连
    this.#attemptReconnect();

    // 返回一个Promise，等待第一次重连尝试结果
    return new Promise(resolve => {
      // 监听重连成功事件
      const successHandler = () => {
        this.off(MessageType.PDFJS_INTERFACE_READY, successHandler);
        this.off("reconnect_attempts_exhausted", failureHandler);
        resolve(true);
      };

      // 监听重连失败事件（所有重连尝试都失败）
      const failureHandler = () => {
        this.off(MessageType.PDFJS_INTERFACE_READY, successHandler);
        this.off("reconnect_attempts_exhausted", failureHandler);
        resolve(false);
      };

      this.on(MessageType.PDFJS_INTERFACE_READY, successHandler);
      this.on("reconnect_attempts_exhausted", failureHandler);

      // 设置超时，防止永久等待
      setTimeout(() => {
        this.off(MessageType.PDFJS_INTERFACE_READY, successHandler);
        this.off("reconnect_attempts_exhausted", failureHandler);
        resolve(this.#isReady); // 如果已就绪则返回true，否则false
      }, 10000); // 10秒超时
    });
  }

  /**
   * 兼容方法：等待PDF.js查看器准备就绪（老API）
   * @returns {Promise<void>}
   */
  async onViewerReady() {
    console.log("PDFJSInterface: 使用onViewerReady方法等待查看器准备就绪");
    try {
      return await this.ready(45000); // 使用更长的超时时间（45秒）
    } catch (error) {
      console.error("PDFJSInterface: onViewerReady失败", error);
      throw error;
    }
  }

  /**
   * 销毁接口实例
   * 清理所有资源和事件监听器
   * @param {boolean} [removeFromSingleton=true] - 是否从单例管理器中移除此实例
   */
  destroy(removeFromSingleton = true) {
    // 移除全局消息事件监听器
    if (this.#boundMessageHandler) {
      window.removeEventListener("message", this.#boundMessageHandler);
      this.#boundMessageHandler = null;
    }

    // 移除iframe load事件监听器
    if (this.#iframe && this.#boundIframeLoadHandler) {
      try {
        this.#iframe.removeEventListener("load", this.#boundIframeLoadHandler);
        this.#boundIframeLoadHandler = null;
      } catch (e) {
        // 忽略可能的错误，如iframe已被移除
        console.warn("PDFJSInterface: 移除iframe load事件监听器时发生错误", e);
      }
    }

    // 清理所有待处理的请求
    if (this.#pendingRequests.size > 0) {
      // 遍历并清理所有待处理请求
      for (const request of this.#pendingRequests.values()) {
        // 清除超时计时器
        if (request.timeoutId) {
          clearTimeout(request.timeoutId);
        }

        // 拒绝所有未完成的请求
        if (request.reject) {
          request.reject(new Error("Interface被销毁，请求被取消"));
        }
      }
      // 清空请求映射
      this.#pendingRequests.clear();
    }

    // 清除事件监听器
    this._clearAllEventListeners();

    // 如果需要，从单例管理器中移除此实例
    if (removeFromSingleton && this.#iframe) {
      PDFJSInterface.#instances.delete(this.#iframe);
    }

    // 清除重连定时器（如果有的话）
    if (this.#reconnectTimerId !== null) {
      clearTimeout(this.#reconnectTimerId);
      this.#reconnectTimerId = null;
    }

    // 清除其他引用
    this.#iframe = null;
    this.#onReadyCallback = null;
    this.#isReady = false;
    this.#reconnectAttempts = 0;
    this.#isReconnecting = false;

    console.log("PDFJSInterface: 实例已销毁");
  }

  /**
   * 重置接口状态
   * 清理所有监听器和待处理请求，但不销毁实例
   */
  reset() {
    console.log("PDFJSInterface: 重置接口状态");

    // 清理所有待处理的请求
    if (this.#pendingRequests.size > 0) {
      for (const request of this.#pendingRequests.values()) {
        if (request.timeoutId) {
          clearTimeout(request.timeoutId);
        }
        if (request.reject) {
          request.reject(new Error("Interface被重置，请求被取消"));
        }
      }
      this.#pendingRequests.clear();
    }

    // 清除事件监听器但保留消息处理
    this._clearAllEventListeners();

    // 清除重连定时器（如果有的话）
    if (this.#reconnectTimerId !== null) {
      clearTimeout(this.#reconnectTimerId);
      this.#reconnectTimerId = null;
    }

    // 重置状态
    this.#isReady = false;
    this.#onReadyCallback = null;
    this.#reconnectAttempts = 0;
    this.#isReconnecting = false;

    // 注意：不需要重置boundIframeLoadHandler，因为iframe仍然需要继续监听加载事件

    return this;
  }
}

export { MessageType, PDFJSInterface };
