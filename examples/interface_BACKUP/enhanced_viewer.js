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

import { EventEmitter } from "./event_emitter.js";
import { MessageType } from "./message_type.js";
import { PDFJSInterface } from "./pdf_js_interface.js";

/**
 * 增强型PDF.js查看器封装类
 * 提供更高级的抽象，简化用户集成过程
 */
class EnhancedPDFViewer extends EventEmitter {
  /**
   * 存储容器元素到查看器实例的映射
   * @type {WeakMap<HTMLElement, EnhancedPDFViewer>}
   * @private
   * @static
   */
  static instances = new WeakMap();

  /**
   * 获取或创建增强型PDF查看器实例
   * @param {HTMLElement|string} container - 容器元素或其ID
   * @param {Object} options - 配置选项
   * @returns {EnhancedPDFViewer} 查看器实例
   */
  static getInstance(container, options = {}) {
    // 如果传入的是ID，先获取DOM元素
    let containerElement;
    if (typeof container === "string") {
      containerElement = document.getElementById(container);
      if (!containerElement) {
        throw new Error(`找不到ID为 ${container} 的容器元素`);
      }
    } else if (container instanceof HTMLElement) {
      containerElement = container;
    } else {
      throw new Error("需要提供有效的容器元素或其ID");
    }

    // 检查是否已有实例
    if (EnhancedPDFViewer.instances.has(containerElement)) {
      const instance = EnhancedPDFViewer.instances.get(containerElement);
      // 如果提供了新选项，更新现有实例的选项
      if (options && Object.keys(options).length > 0) {
        // 更新选项，不需要清除事件监听器，因为updateOptions不会注册新的监听器
        // 只有在loadPDF和特定操作时才需要清理监听器
        instance.updateOptions(options);
      }
      console.log("EnhancedPDFViewer: 使用现有实例");
      return instance;
    }

    console.log("EnhancedPDFViewer: 创建新实例");
    // 创建新实例
    const instance = new EnhancedPDFViewer(containerElement, options);
    EnhancedPDFViewer.instances.set(containerElement, instance);
    return instance;
  }

  /**
   * @type {HTMLIFrameElement} PDF.js iframe元素
   */
  #iframe = null;

  /**
   * @type {PDFJSInterface} PDF.js通信接口
   */
  #interface = null;

  /**
   * @type {Object} 查看器配置选项
   */
  #options = {};

  /**
   * @type {HTMLElement} 容器元素
   */
  #container = null;

  /**
   * @type {string} PDF文件URL
   */
  #pdfUrl = null;

  // 注意：事件监听器现在由 EventEmitter 基类处理

  /**
   * @type {boolean} 查看器是否已准备就绪
   */
  #isReady = false;

  /**
   * @type {Function} 准备就绪回调
   */
  #onReadyCallback = null;

  /**
   * @type {number|null} 加载超时计时器ID
   */
  #loadTimeoutId = null;

  /**
   * 构造函数
   * @param {HTMLElement|string} container - 容器元素或其ID
   * @param {Object} options - 配置选项
   */
  constructor(container, options = {}) {
    super();

    // 初始化容器
    if (typeof container === "string") {
      this.#container = document.getElementById(container);
      if (!this.#container) {
        throw new Error(`找不到ID为 ${container} 的容器元素`);
      }
    } else if (container instanceof HTMLElement) {
      this.#container = container;
    } else {
      throw new Error("需要提供有效的容器元素或其ID");
    }

    // 合并默认选项
    this.#options = {
      // iframe属性
      width: "100%",
      height: "100%",
      style: "border: none;",
      allowfullscreen: true,

      // 查看器参数
      enableDownload: true,
      enablePrint: true,
      enableAnnotations: true,
      enableTextSelection: true,

      // 高级选项
      viewerPath: "../../web/viewer.html",
      enableXfa: true,
      disableRange: true,
      postMessageTransfers: true,
      debugger: false,

      // 合并用户提供的选项
      ...options,
    };

    // 创建自动代理到interface实例的方法
    this.#setupInterfaceProxy();
  }

  /**
   * 设置接口代理，自动将方法调用转发到PDFJSInterface实例
   *
   * 支持三种类型的方法:
   * 1. 直接代理 - 简单地将调用转发到接口
   * 2. 别名方法 - 使用不同名称调用接口的方法
   * 3. 自定义方法 - 提供额外的或增强的功能
   *
   * @private
   */
  #setupInterfaceProxy() {
    // 获取PDFJSInterface的原型
    const interfaceProto = Object.getPrototypeOf(PDFJSInterface.prototype);

    // 方法名称映射，用于创建别名方法
    // 格式: { enhancedMethodName: interfaceMethodName }
    const methodMappings = {
      clearHighlightById: "clearHighlight", // 清除特定ID的标注高亮
      clearAllHighlights: "clearHighlights", // 清除所有标注高亮
      highlightText: "setTextHighlight", // 设置文本高亮
      // 注意：clearTextHighlight和clearHighlight是两个不同的功能
      // clearTextHighlight：清除搜索文本高亮
      // clearHighlight：清除特定ID的标注高亮
    };

    // 获取所有公共方法（不包括继承的EventEmitter方法）
    const methodNames = Object.getOwnPropertyNames(
      PDFJSInterface.prototype
    ).filter(
      name =>
        typeof PDFJSInterface.prototype[name] === "function" &&
        name !== "constructor" &&
        !name.startsWith("_") &&
        !interfaceProto[name] // 排除从EventEmitter继承的方法
    );

    // 1. 直接代理方法
    for (const methodName of methodNames) {
      // 如果EnhancedPDFViewer已经有这个方法或者在映射中有定义，跳过
      if (
        this[methodName] ||
        Object.values(methodMappings).includes(methodName)
      ) {
        continue;
      }

      // 创建代理方法
      this[methodName] = async function (...args) {
        if (!this.#interface) {
          throw new Error(`接口尚未初始化，无法调用 ${methodName}`);
        }

        if (!this.#isReady) {
          await this.#ensureInterfaceReady();
        }

        // 调用接口方法
        return this.#interface[methodName](...args);
      };
    }

    // 2. 创建别名方法
    for (const [enhancedName, interfaceName] of Object.entries(
      methodMappings
    )) {
      // 如果别名方法已经存在，跳过
      if (this[enhancedName]) {
        continue;
      }

      this[enhancedName] = async function (...args) {
        if (!this.#interface) {
          throw new Error(`接口尚未初始化，无法调用 ${enhancedName}`);
        }

        if (!this.#isReady) {
          await this.#ensureInterfaceReady();
        }

        // 调用接口方法
        return this.#interface[interfaceName](...args);
      };
    }
  }

  /**
   * 创建iframe元素
   * @private
   */
  #createIframe() {
    // 创建iframe元素
    this.#iframe = document.createElement("iframe");

    // 设置iframe属性
    this.#iframe.width = this.#options.width;
    this.#iframe.height = this.#options.height;
    this.#iframe.style = this.#options.style;

    if (this.#options.allowfullscreen) {
      this.#iframe.allowFullscreen = true;
    }

    this.#iframe.id =
      this.#options.id ||
      "pdf-js-viewer-" + Math.random().toString(36).substring(2, 9);

    // 添加iframe到容器
    this.#container.append(this.#iframe);

    // 使用单例模式获取通信接口实例
    this.#interface = PDFJSInterface.getInstance(this.#iframe);

    // 转发所有事件
    // this.#setupEventForwarding();
  }

  /**
   * 设置事件转发
   * @private
   */
  #setupEventForwarding() {
    if (!this.#interface) {
      console.error("EnhancedPDFViewer: 无法设置事件转发，接口未初始化");
      return;
    }

    // 先清除所有可能存在的事件监听器，防止重复注册
    Object.values(MessageType).forEach(eventType => {
      this.#interface.off(eventType);
    });

    // 将所有消息类型转发到当前实例的事件系统
    Object.values(MessageType).forEach(eventType => {
      // PDFJS_INTERFACE_READY 将在下面特殊处理，所以这里跳过
      if (eventType !== MessageType.PDFJS_INTERFACE_READY) {
        this.#interface.on(eventType, data => {
          console.log(`EnhancedPDFViewer: 接收到事件 ${eventType}`, data);
          this._triggerEvent(eventType, data);
        });
      }
    });

    // 特殊处理ready事件
    this.#interface.on(MessageType.PDFJS_INTERFACE_READY, () => {
      console.log("EnhancedPDFViewer: 接收到查看器准备就绪事件");
      this.#isReady = true;
      this._triggerEvent(MessageType.PDFJS_INTERFACE_READY, {});

      // 如果有等待的回调，执行它并清除
      if (this.#onReadyCallback) {
        this.#onReadyCallback();
        this.#onReadyCallback = null;
      }

      // 清除任何超时计时器
      if (this.#loadTimeoutId !== null) {
        clearTimeout(this.#loadTimeoutId);
        this.#loadTimeoutId = null;
      }
    });
  }

  /**
   * 确保接口就绪的辅助方法
   * 通过缓存接口ready的结果，避免重复触发ready流程
   * @returns {Promise<void>}
   * @private
   */
  async #ensureInterfaceReady() {
    if (!this.#interface) {
      throw new Error("接口尚未初始化");
    }

    if (this.#isReady) {
      // 如果本地已知接口就绪，不需要调用接口的ready方法
      return;
    }

    try {
      // 调用接口的ready方法，但传入更长的超时时间
      await this.#interface.ready(30000);
      // 成功后标记本地状态为就绪
      this.#isReady = true;
    } catch (error) {
      console.error("EnhancedPDFViewer: 等待接口准备就绪失败", error);
      throw error;
    }
  }

  /**
   * 构建查看器URL
   * @param {string} pdfUrl - PDF文件的URL
   * @returns {string} 完整的查看器URL
   * @private
   */
  #buildViewerUrl(pdfUrl) {
    const viewerUrl = new URL(this.#options.viewerPath, window.location.href);

    // 添加PDF文件URL
    if (pdfUrl) {
      // 处理不同类型的URL
      try {
        // 如果是完整URL，直接使用
        if (pdfUrl.startsWith("http://") || pdfUrl.startsWith("https://")) {
          viewerUrl.searchParams.set("file", encodeURIComponent(pdfUrl));
        }
        // 如果是相对路径，转换为绝对路径
        else {
          const absoluteUrl = new URL(pdfUrl, window.location.href).href;
          viewerUrl.searchParams.set("file", encodeURIComponent(absoluteUrl));
        }
      } catch (e) {
        console.error("URL处理错误:", e);
        viewerUrl.searchParams.set("file", encodeURIComponent(pdfUrl));
      }
    }

    // 添加配置参数
    if (!this.#options.enableDownload) {
      viewerUrl.searchParams.set("download", "false");
    }

    if (!this.#options.enablePrint) {
      viewerUrl.searchParams.set("print", "false");
    }

    if (this.#options.initialPage) {
      viewerUrl.searchParams.set("page", this.#options.initialPage);
    }

    if (this.#options.initialZoom) {
      viewerUrl.searchParams.set("zoom", this.#options.initialZoom);
    }

    if (this.#options.locale) {
      viewerUrl.searchParams.set("locale", this.#options.locale);
    }

    // 添加高级参数
    if (this.#options.enableXfa) {
      viewerUrl.searchParams.set("enableXfa", "true");
    }

    if (this.#options.disableRange) {
      viewerUrl.searchParams.set("disableRange", "true");
    }

    if (this.#options.postMessageTransfers) {
      viewerUrl.searchParams.set("postMessageTransfers", "true");
    }

    if (this.#options.debugger) {
      viewerUrl.searchParams.set("debugger", "true");
    }

    return viewerUrl.toString();
  }

  /**
   * 清理所有事件监听器
   * 同时清理 EnhancedPDFViewer 实例和 PDFJSInterface 实例上的监听器
   * @private
   */
  #cleanupEventListeners() {
    // 清理当前实例上的事件监听器
    this._clearAllEventListeners();

    // 清理接口实例上的事件监听器
    if (this.#interface) {
      Object.values(MessageType).forEach(eventType => {
        this.#interface.off(eventType);
      });
    }
  }

  /**
   * 加载PDF文件
   * @param {string} pdfUrl - PDF文件的URL
   * @returns {Promise} - 当查看器准备就绪时解析
   */
  loadPDF(pdfUrl) {
    this.#pdfUrl = pdfUrl;

    // 重置准备就绪状态
    this.#isReady = false;

    // 如果iframe不存在，创建它
    if (!this.#iframe) {
      this.#createIframe();
    } else {
      // 使用单例模式获取通信接口实例
      this.#interface = PDFJSInterface.getInstance(this.#iframe);

      // // 重新设置事件转发
      // this.#setupEventForwarding();

      // 重新设置接口代理
      this.#setupInterfaceProxy();
    }

    // 构建查看器URL并加载
    const viewerUrl = this.#buildViewerUrl(pdfUrl);
    console.log("EnhancedPDFViewer: 加载PDF文件", pdfUrl);
    this.#iframe.src = viewerUrl;

    // 返回准备就绪的Promise
    return new Promise((resolve, reject) => {
      // 存储回调，供后续使用
      this.#onReadyCallback = resolve;

      // 清除可能存在的旧超时计时器
      if (this.#loadTimeoutId !== null) {
        clearTimeout(this.#loadTimeoutId);
        this.#loadTimeoutId = null;
      }

      // 设置新的超时计时器
      const timeout = this.#options.timeout || 10000;
      this.#loadTimeoutId = setTimeout(() => {
        if (!this.#isReady) {
          this.#loadTimeoutId = null;
          this.#onReadyCallback = null;
          reject(new Error(`PDF查看器加载超时（${timeout}ms）`));
        }
      }, timeout);
    });
  }

  /**
   * 重新加载当前PDF
   * @returns {Promise} - 当查看器准备就绪时解析
   */
  reload() {
    return this.loadPDF(this.#pdfUrl);
  }

  // 注意：on 和 off 方法由 EventEmitter 基类提供

  /**
   * 获取iframe元素
   * @returns {HTMLIFrameElement} iframe元素
   */
  getIframe() {
    return this.#iframe;
  }

  /**
   * 获取接口对象
   * @returns {PDFJSInterface} 接口对象
   */
  getInterface() {
    return this.#interface;
  }

  /**
   * 获取增强的接口对象，自动处理ready状态
   * @returns {Proxy<PDFJSInterface>} 代理后的接口对象
   */
  // getEnhancedInterface() {
  //   if (!this.#interface) {
  //     throw new Error("接口尚未初始化");
  //   }

  //   // 创建一个代理，自动为所有方法调用添加ready状态检查
  //   return new Proxy(this.#interface, {
  //     get: (target, prop) => {
  //       const originalValue = target[prop];

  //       // 如果不是方法或是内部方法，直接返回原值
  //       if (
  //         typeof originalValue !== "function" ||
  //         prop.toString().startsWith("#") ||
  //         prop === "ready" ||
  //         prop === "ping"
  //       ) {
  //         return originalValue;
  //       }

  //       // 对方法进行包装，自动确保接口准备就绪
  //       return async (...args) => {
  //         if (!this.#isReady) {
  //           await this.#ensureInterfaceReady();
  //         }
  //         return originalValue.apply(target, args);
  //       };
  //     },
  //   });
  // }

  /**
   * 获取当前配置选项
   * @returns {Object} 配置选项
   */
  getOptions() {
    return { ...this.#options };
  }

  /**
   * 更新配置选项
   * @param {Object} newOptions - 新的配置选项
   * @returns {EnhancedPDFViewer} 返回this用于链式调用
   */
  updateOptions(newOptions) {
    if (!newOptions || typeof newOptions !== "object") {
      return this;
    }

    // 合并新选项
    this.#options = {
      ...this.#options,
      ...newOptions,
    };

    // 如果iframe已存在，更新其属性
    if (this.#iframe) {
      if (newOptions.width) {
        this.#iframe.width = newOptions.width;
      }
      if (newOptions.height) {
        this.#iframe.height = newOptions.height;
      }
      if (newOptions.style) {
        this.#iframe.style = newOptions.style;
      }
      if (newOptions.allowfullscreen !== undefined) {
        this.#iframe.allowFullscreen = newOptions.allowfullscreen;
      }
    }

    return this;
  }

  // 注意：getCurrentPage, getPageCount, goToPage 方法现在由代理自动处理

  // /**
  //  * 下一页
  //  * @returns {Promise<Object>} 操作结果
  //  */
  // async nextPage() {
  //   const currentPage = await this.getCurrentPage();
  //   const pageCount = await this.getPageCount();

  //   if (currentPage < pageCount) {
  //     return this.goToPage(currentPage + 1);
  //   }

  //   return { success: false, message: "已经是最后一页" };
  // }

  // /**
  //  * 上一页
  //  * @returns {Promise<Object>} 操作结果
  //  */
  // async prevPage() {
  //   const currentPage = await this.getCurrentPage();

  //   if (currentPage > 1) {
  //     return this.goToPage(currentPage - 1);
  //   }

  //   return { success: false, message: "已经是第一页" };
  // }

  // // 注意: setZoom 方法现在由代理自动处理

  // /**
  //  * 放大
  //  * @returns {Promise<Object>} 操作结果
  //  */
  // async zoomIn() {
  //   return this.setZoom("in");
  // }

  // /**
  //  * 缩小
  //  * @returns {Promise<Object>} 操作结果
  //  */
  // async zoomOut() {
  //   return this.setZoom("out");
  // }

  // // 注意: rotatePages 方法现在由代理自动处理

  // /**
  //  * 顺时针旋转
  //  * @returns {Promise<Object>} 操作结果
  //  */
  // rotateCW() {
  //   return this.rotatePages(90);
  // }

  // /**
  //  * 逆时针旋转
  //  * @returns {Promise<Object>} 操作结果
  //  */
  // rotateCCW() {
  //   return this.rotatePages(-90);
  // }

  // 注意: findText 方法现在由代理自动处理
  // 注意: 以下方法现在由代理自动处理
  // 注意：getHighlights 方法现在由代理自动处理
  // - setTextHighlight
  // - clearTextHighlight
  // - clearHighlight
  // - clearHighlights
  // - getAnnotations
  // - addAnnotation
  // - updateAnnotation
  // - deleteAnnotation

  // 注意: 以下方法现在由代理自动处理
  // - getDocumentInfo
  // - getDocumentOutline
  // - downloadPdf
  // - printPdf
  // - navigateTo
  // - getAllText
  // - getPageText
  // - reconnect

  /**
   * 销毁查看器
   * 清理资源，移除DOM元素，并确保释放所有关联资源
   * @param {boolean} [removeFromSingleton=true] - 是否从单例管理器中移除此实例
   */
  destroy(removeFromSingleton = true) {
    // 清理所有事件监听器
    this.#cleanupEventListeners();

    // 额外清理特殊的 PDFJS_INTERFACE_READY 事件（如果有的话）
    if (this.#interface) {
      this.#interface.off(MessageType.PDFJS_INTERFACE_READY);
    }

    // 移除iframe前清理其内容窗口中的资源
    // 这可以帮助垃圾回收机制更好地工作
    if (this.#iframe) {
      try {
        // 清理iframe的contentWindow引用
        if (this.#iframe.contentWindow) {
          // 尝试清空iframe内容（帮助浏览器更快地回收内存）
          if (this.#iframe.src) {
            this.#iframe.src = "about:blank";
          }
        }
      } catch (e) {
        // 跨域安全限制可能会导致错误，忽略它们
        console.warn("清理iframe时遇到错误:", e);
      }

      // 从DOM中移除iframe
      if (this.#iframe.parentNode) {
        this.#iframe.remove();
      }
    }

    // 清理超时计时器（如果有的话）
    if (this.#loadTimeoutId !== null) {
      clearTimeout(this.#loadTimeoutId);
      this.#loadTimeoutId = null;
    }

    // 如果需要，从单例管理器中移除此实例
    if (removeFromSingleton && this.#container) {
      EnhancedPDFViewer.instances.delete(this.#container);
    }

    // 清除所有内部引用
    this.#pdfUrl = null;
    this.#options = {};
    this.#iframe = null;
    this.#interface = null;
    this.#isReady = false;
    this.#onReadyCallback = null;
    this.#loadTimeoutId = null; // 确保计时器ID也被清除
    this.#container = null; // 也清除容器引用

    console.log("EnhancedPDFViewer: 实例已销毁");
  }
}

export { EnhancedPDFViewer, MessageType };
