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

/** @typedef {import("../../interfaces.js").EventBus} EventBus */

import { MessageType } from "./message_type.js";

/**
 * Handler class for postMessage communication between PDF.js viewer
 * and the parent iframe.
 */
class PDFMessageHandler {
  /**
   * @type {PDFApplication} The PDFApplication instance
   * @private
   */
  #pdfApplication = null;

  /**
   * @type {EventBus} The event bus to use for event dispatching
   * @private
   */
  #eventBus = null;

  /**
   * @param {Object} options - 配置选项
   * @param {PDFApplication} options.pdfApplication - PDF应用实例
   * @param {EventBus} options.eventBus - 用于事件分发的事件总线
   * @param {Array<string>} [options.originWhitelist] - 允许的消息来源白名单
   */
  constructor({ eventBus, pdfApplication, originWhitelist = null }) {
    this.#pdfApplication = pdfApplication;
    this.#eventBus = eventBus;

    // Add the message listener
    window.addEventListener("message", this.#handleMessage.bind(this));

    // Setup internal event listeners
    if (this.#eventBus) {
      this.#setupInternalEventListeners();
    } else {
      console.warn(
        "PDFMessageHandler: eventBus is undefined, event forwarding is disabled"
      );
    }
  }

  /**
   * Setup internal event listeners for PDF.js events
   * @private
   */
  #setupInternalEventListeners() {
    // Listen for document loaded event
    this.#eventBus.on("documentloaded", () => {
      this.#sendMessage({
        type: MessageType.PDFJS_INTERFACE_READY,
        data: {
          version:
            typeof PDFJSDev !== "undefined"
              ? PDFJSDev.eval("BUNDLE_VERSION")
              : null,
          title: this.#pdfApplication._title,
          numPages: this.#pdfApplication.pagesCount,
        },
      });
      //   this.#sendMessage({
      //     type: MessageType.DOCUMENT_LOADED,
      //     data: {
      //       title: this.#pdfApplication._title,
      //       numPages: this.#pdfApplication.pagesCount,
      //     },
      //   });
    });

    // Listen for highlight events
    this.#eventBus.on("highlightCreated", event => {
      this.#sendMessage({
        type: MessageType.HIGHLIGHT_CREATED,
        data: {
          id: event.id,
          page: event.page,
          text: event.text,
          color: event.color,
        },
      });
    });

    // // 注册文本选择事件，用于触发高亮
    // this.#eventBus.on("textlayerrendered", () => {
    //   const container = document.getElementById("viewerContainer");
    //   if (!container) {
    //     return;
    //   }

    //   // 避免重复添加监听器
    //   if (!container.dataset.highlightListenerAdded) {
    //     container.dataset.highlightListenerAdded = true;

    //     // 监听选择事件
    //     document.addEventListener("selectionchange", () => {
    //       const selection = window.getSelection();
    //       if (
    //         selection &&
    //         !selection.isCollapsed &&
    //         selection.toString().trim()
    //       ) {
    //         // 在这里，用户已经选择了文本，可以在控制台输出调试信息
    //         console.log("Text selected:", selection.toString());
    //         // 高亮相关逻辑由编辑器或其他组件处理
    //       }
    //     });
    //   }
    // });

    this.#eventBus.on("highlightRemoved", event => {
      this.#sendMessage({
        type: MessageType.HIGHLIGHT_REMOVED,
        data: {
          id: event.id,
          page: event.page,
        },
      });
    });

    // Listen for page rendered event
    this.#eventBus.on("pagerendered", event => {
      this.#sendMessage({
        type: MessageType.PAGE_RENDERED,
        data: {
          pageNumber: event.pageNumber,
          error: event.error || null,
        },
      });
    });

    // Listen for page changed event
    this.#eventBus.on("pagechanging", event => {
      this.#sendMessage({
        type: MessageType.PAGE_CHANGED,
        data: event.pageNumber,
      });
    });

    // Listen for annotation events
    this.#eventBus.on("annotationadded", event => {
      this.#sendMessage({
        type: MessageType.ANNOTATION_ADDED,
        data: event.annotation,
      });
    });

    this.#eventBus.on("annotationupdated", event => {
      this.#sendMessage({
        type: MessageType.ANNOTATION_UPDATED,
        data: event.annotation,
      });
    });

    this.#eventBus.on("annotationdeleted", event => {
      this.#sendMessage({
        type: MessageType.ANNOTATION_DELETED,
        data: {
          id: event.id,
        },
      });
    });
  }

  /**
   * Handle incoming messages from the parent iframe
   * @param {MessageEvent} event - The message event
   * @private
   */
  #handleMessage(event) {
    // Skip messages from our own window or that don't have the expected format
    if (
      event.source === window ||
      !event.data ||
      !event.data.type ||
      typeof event.data.type !== "string"
    ) {
      return;
    }

    const { type, data, requestId } = event.data;

    // Process the message
    this.#processMessage(type, data, requestId).then(
      response => {
        // If there's a requestId, send a response
        if (requestId) {
          this.#sendMessage({
            type,
            data: response,
            requestId,
          });
        }
      },
      error => {
        // If there's an error and a requestId, send an error response
        if (requestId) {
          this.#sendMessage({
            type: `${type}.error`,
            data: {
              message: error.message,
              stack: error.stack,
            },
            requestId,
          });
        }
      }
    );
  }

  /**
   * Send a message to the parent window
   * @param {Object} message - The message to send
   * @private
   */
  #sendMessage(message) {
    // Skip if we're in a main window and not an iframe
    if (window.parent === window) {
      console.warn("PDFMessageHandler: 不在iframe中，消息未发送");
      return;
    }

    try {
      console.log("PDFMessageHandler: 发送消息", message.type);
      window.parent.postMessage(message, "*");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  /**
   * Process a message and return a response
   * @param {string} type - The message type
   * @param {Object} data - The message data
   * @param {string} requestId - The request ID
   * @returns {Promise<any>} - The response
   * @private
   */
  async #processMessage(type, data, requestId) {
    let response;

    try {
      switch (type) {
        case MessageType.GET_HIGHLIGHTS:
          response = await this.#getAllHighlights();
          break;

        case MessageType.CLEAR_HIGHLIGHTS:
          response = await this.#clearAllHighlights();
          break;

        case MessageType.CLEAR_HIGHLIGHT:
          response = await this.#clearHighlight(data.id);
          break;

        case MessageType.GET_TEXT:
          response = await this.#getAllText();
          break;

        case MessageType.GET_PAGE_TEXT:
          response = await this.#getPageText(data.page);
          break;

        case MessageType.GET_CURRENT_PAGE:
          response = this.#getCurrentPage();
          break;

        case MessageType.GET_PAGE_COUNT:
          response = this.#getPageCount();
          break;

        case MessageType.GO_TO_PAGE:
          response = await this.#goToPage(data.pageNumber);
          break;

        case MessageType.SET_TEXT_HIGHLIGHT:
          response = await this.#setTextHighlight(data.text, data.options);
          break;

        case MessageType.CLEAR_TEXT_HIGHLIGHT:
          response = await this.#clearTextHighlight();
          break;

        case MessageType.FIND_TEXT:
          response = await this.#findText(data.text, data.options);
          break;

        case MessageType.GET_DOCUMENT_INFO:
          response = this.#getDocumentInfo();
          break;

        case MessageType.GET_DOCUMENT_OUTLINE:
          response = await this.#getDocumentOutline();
          break;

        case MessageType.GET_ANNOTATIONS:
          response = await this.#getAnnotations(data.pageNumber);
          break;

        case MessageType.ADD_ANNOTATION:
          response = await this.#addAnnotation(data.annotation);
          break;

        case MessageType.UPDATE_ANNOTATION:
          response = await this.#updateAnnotation(data.annotation);
          break;

        case MessageType.DELETE_ANNOTATION:
          response = await this.#deleteAnnotation(data.annotationId);
          break;

        case MessageType.SET_ZOOM:
          response = await this.#setZoom(data.scale);
          break;

        case MessageType.ROTATE_PAGES:
          response = await this.#rotatePages(data.rotation);
          break;

        case MessageType.DOWNLOAD_PDF:
          response = await this.#downloadPdf();
          break;

        case MessageType.PRINT_PDF:
          response = await this.#printPdf();
          break;

        case MessageType.PING:
          response = { pong: true, timestamp: Date.now() };
          break;

        case MessageType.NAVIGATE_TO:
          response = await this.#navigateTo(data.dest);
          break;

        case MessageType.CHECK_READY:
          response = true; // 如果消息处理器正在处理此消息，就代表已准备就绪
          break;

        default:
          throw new Error(`Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error(`Error processing message ${type}:`, error);
      throw error;
    }

    return response;
  }

  /**
   * Get all highlights from the document
   * @returns {Promise<Array>} Array of highlight objects
   */
  async #getAllHighlights() {
    const annotationStorage =
      this.#pdfApplication.pdfDocument?.annotationStorage;
    if (!annotationStorage) {
      return [];
    }

    const highlights = [];

    for (const [key, value] of annotationStorage) {
      if (value.editorType === "highlight") {
        highlights.push({
          id: key,
          page: value.pageIndex + 1,
          text: value.text || "",
          color: value.color,
        });
      }
    }

    return highlights;
  }

  /**
   * Clear all highlights from the document
   * @returns {Promise<Object>} Result of the operation
   */
  async #clearAllHighlights() {
    // 获取当前高亮
    const highlights = await this.#getAllHighlights();
    const annotationStorage =
      this.#pdfApplication.pdfDocument?.annotationStorage;

    if (!annotationStorage) {
      return { success: false, error: "PDF annotationStorage not available" };
    }

    // 清除找到的高亮
    const clearedIds = [];

    for (const highlight of highlights) {
      try {
        const editor = annotationStorage.getRawValue(highlight.id);
        if (editor && editor.editorType === "highlight") {
          editor.cancel_event = true; // 标记为取消事件
          editor.remove();
          clearedIds.push(highlight.id);
        }
      } catch (error) {
        console.error(`Error clearing highlight ${highlight.id}:`, error);
      }
    }

    return { success: true, clearedCount: clearedIds.length };
  }

  /**
   * Clear a specific highlight by ID
   * @param {string} id - The ID of the highlight to clear
   * @returns {Promise<Object>} Result of the operation
   */
  async #clearHighlight(id) {
    const annotationEditor =
      this.#pdfApplication.pdfDocument?.annotationStorage?.getRawValue(id);
    if (!annotationEditor) {
      return { success: false, error: "Required resources not available" };
    }
    annotationEditor.cancel_event = true; // 标记为取消事件
    annotationEditor.remove();
    return { success: true, id };
  }

  /**
   * Get text content from all pages
   * @returns {Promise<Array<{page: number, text: string}>>}
   */
  async #getAllText() {
    const textContent = [];
    const pdfDocument = this.#pdfApplication.pdfDocument;

    if (!pdfDocument) {
      return textContent;
    }

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      try {
        const text = await this.#getPageText(i);
        textContent.push(text);
      } catch (error) {
        console.error(`Error getting text for page ${i}:`, error);
        textContent.push({ page: i, text: "" });
      }
    }

    return textContent;
  }

  /**
   * Get text content from a specific page
   * @param {number} pageNumber - The page number (1-based)
   * @returns {Promise<{page: number, text: string}>}
   */
  async #getPageText(pageNumber) {
    const pdfDocument = this.#pdfApplication.pdfDocument;

    if (!pdfDocument || pageNumber < 1 || pageNumber > pdfDocument.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    const page = await pdfDocument.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(" ");

    return { page: pageNumber, text };
  }

  /**
   * Get the current page number
   * @returns {number} The current page number (1-based)
   */
  #getCurrentPage() {
    return this.#pdfApplication.page || 1;
  }

  /**
   * Get the total number of pages in the document
   * @returns {number} The page count
   */
  #getPageCount() {
    return this.#pdfApplication.pagesCount || 0;
  }

  /**
   * Navigate to a specific page
   * @param {number} pageNumber - The page number to navigate to (1-based)
   * @returns {Promise<{success: boolean}>} Success status
   */
  async #goToPage(pageNumber) {
    if (!this.#pdfApplication.pdfDocument) {
      throw new Error("No document loaded");
    }

    if (pageNumber < 1 || pageNumber > this.#pdfApplication.pagesCount) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    this.#pdfApplication.page = pageNumber;
    return { success: true, page: pageNumber };
  }

  /**
   * Set text highlight for matching text
   * @param {string} text - Text to highlight
   * @param {Object} options - Highlight options
   * @returns {Promise<{success: boolean, count: number}>} Success status and match count
   */
  async #setTextHighlight(text, options = {}) {
    if (!this.#pdfApplication.pdfDocument || !text) {
      throw new Error("No document loaded or empty search text");
    }

    // 获取当前页面
    const currentPage = this.#pdfApplication.page || 1;
    const color = options.color || "#FFFF00"; // 默认黄色

    try {
      // 使用findBar查找文本（这是一种临时的解决方案）
      this.#pdfApplication.findBar.open();
      this.#pdfApplication.findBar.findField.value = text;

      // 设置高亮颜色（如果支持）
      if (this.#pdfApplication.findBar.highlightColor) {
        this.#pdfApplication.findBar.highlightColor = color;
      }

      // 触发搜索
      this.#pdfApplication.findBar.highlightAllCheckbox.checked = true;
      this.#pdfApplication.findBar.findNextButton.click();

      // 创建唯一ID
      const highlightId = `highlight_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // 触发自定义高亮创建事件
      setTimeout(() => {
        this.#eventBus.dispatch("highlightCreated", {
          source: this,
          id: highlightId,
          page: currentPage,
          text,
          color,
        });
      }, 100); // 给一点时间让findBar完成高亮

      return {
        success: true,
        id: highlightId,
        text,
        page: currentPage,
        color,
      };
    } catch (error) {
      console.error("Error setting text highlight:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear all text highlights
   * @returns {Promise<{success: boolean}>} Success status
   */
  async #clearTextHighlight() {
    if (this.#pdfApplication.findBar) {
      this.#pdfApplication.findBar.close();
    }
    return { success: true };
  }

  /**
   * Find text in the document
   * @param {string} text - Text to find
   * @param {Object} options - Find options
   * @returns {Promise<{found: boolean, page?: number}>} Find result
   */
  async #findText(text, options = {}) {
    if (!this.#pdfApplication.pdfDocument || !text) {
      throw new Error("No document loaded or empty search text");
    }

    // Configure find controller
    const findController = this.#pdfApplication.findController;
    findController.caseSensitive = !!options.caseSensitive;
    findController.entireWord = !!options.wholeWord;

    // Set direction
    const findDirection =
      options.direction === "backward" ? /* BACKWARDS */ -1 : /* FORWARDS */ 1;

    // Perform search
    await findController.executeCommand("find", {
      query: text,
      phraseSearch: true,
      caseSensitive: !!options.caseSensitive,
      entireWord: !!options.wholeWord,
      findPrevious: findDirection < 0,
      highlightAll: false,
    });

    // Get results
    const matchesCount = findController.matchesCount || 0;
    const currentMatch =
      findController.selected?.pageIdx !== undefined
        ? findController.selected
        : null;

    return {
      found: matchesCount > 0,
      page: currentMatch ? currentMatch.pageIdx + 1 : undefined,
      matchesCount,
    };
  }

  /**
   * Get document metadata and info
   * @returns {Object} Document information
   */
  #getDocumentInfo() {
    const doc = this.#pdfApplication.pdfDocument;
    if (!doc) {
      throw new Error("No document loaded");
    }

    return {
      title: this.#pdfApplication._title || "",
      author: doc.info?.Author || "",
      subject: doc.info?.Subject || "",
      keywords: doc.info?.Keywords || "",
      creator: doc.info?.Creator || "",
      producer: doc.info?.Producer || "",
      creationDate: doc.info?.CreationDate || "",
      modificationDate: doc.info?.ModDate || "",
      pageCount: doc.numPages || 0,
    };
  }

  /**
   * Get document outline/bookmarks
   * @returns {Promise<Array>} Document outline items
   */
  async #getDocumentOutline() {
    const doc = this.#pdfApplication.pdfDocument;
    if (!doc) {
      throw new Error("No document loaded");
    }

    const outline = await doc.getOutline();
    return outline || [];
  }

  /**
   * Get annotations on a specific page
   * @param {number} pageNumber - Page number (1-based)
   * @returns {Promise<Array>} Array of annotations
   */
  async #getAnnotations(pageNumber) {
    const doc = this.#pdfApplication.pdfDocument;
    if (!doc) {
      throw new Error("No document loaded");
    }

    if (pageNumber < 1 || pageNumber > doc.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    const page = await doc.getPage(pageNumber);
    const annotations = await page.getAnnotations();

    return annotations.map(annotation => ({
      id: annotation.id,
      type: annotation.subtype,
      rect: annotation.rect,
      contents: annotation.contents,
      pageIndex: pageNumber - 1,
      color: annotation.color
        ? annotation.color.map(c => Math.round(c * 255))
        : undefined,
    }));
  }

  /**
   * Add an annotation
   * @param {Object} annotation - Annotation data
   * @returns {Promise<Object>} The added annotation
   */
  async #addAnnotation(annotation) {
    // This would need to be implemented with PDF.js annotation APIs
    throw new Error("Add annotation not implemented yet");
  }

  /**
   * Update an annotation
   * @param {Object} annotation - Annotation data with id
   * @returns {Promise<Object>} The updated annotation
   */
  async #updateAnnotation(annotation) {
    // This would need to be implemented with PDF.js annotation APIs
    throw new Error("Update annotation not implemented yet");
  }

  /**
   * Delete an annotation
   * @param {string} annotationId - ID of the annotation to delete
   * @returns {Promise<{success: boolean}>} Success status
   */
  async #deleteAnnotation(annotationId) {
    // This would need to be implemented with PDF.js annotation APIs
    throw new Error("Delete annotation not implemented yet");
  }

  /**
   * Set the zoom level
   * @param {string|number} scale - The zoom value
   * @returns {Promise<{success: boolean}>} Success status
   */
  async #setZoom(scale) {
    try {
      if (typeof scale === "number") {
        this.#pdfApplication.pdfViewer.currentScaleValue = scale;
      } else if (scale === "in") {
        this.#pdfApplication.zoomIn();
      } else if (scale === "out") {
        this.#pdfApplication.zoomOut();
      } else {
        this.#pdfApplication.pdfViewer.currentScaleValue = scale;
      }
      return { success: true, scale };
    } catch (error) {
      console.error("Error setting zoom:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rotate pages
   * @param {number} rotation - Rotation angle in degrees
   * @returns {Promise<{success: boolean}>} Success status
   */
  async #rotatePages(rotation) {
    try {
      const delta = rotation;
      this.#pdfApplication.rotatePages(delta);
      return { success: true, rotation: delta };
    } catch (error) {
      console.error("Error rotating pages:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download the current PDF
   * @returns {Promise<{success: boolean}>} Success status
   */
  async #downloadPdf() {
    try {
      this.#pdfApplication.download();
      return { success: true };
    } catch (error) {
      console.error("Error downloading PDF:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Print the current PDF
   * @returns {Promise<{success: boolean}>} Success status
   */
  async #printPdf() {
    try {
      this.#pdfApplication.print();
      return { success: true };
    } catch (error) {
      console.error("Error printing PDF:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Navigate to a destination in the PDF
   * @param {Object|string|Array} dest - The destination
   * @returns {Promise<{success: boolean}>} Success status
   */
  async #navigateTo(dest) {
    try {
      await this.#pdfApplication.pdfLinkService.goToDestination(dest);
      return { success: true };
    } catch (error) {
      console.error("Error navigating to destination:", error);
      return { success: false, error: error.message };
    }
  }
}

// Export for use in viewer.js
export { MessageType, PDFMessageHandler };
