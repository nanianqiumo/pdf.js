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
 * PDF.js 与父 iframe 之间通信的消息类型常量
 * @enum {string}
 */
/**
 * 消息类型枚举
 * 用于在 PDF.js 内部通信的消息类型定义
 * 这个文件集中定义了所有的消息类型，便于维护和扩展
 */
const MessageType = {
  // 系统和控制消息
  PDFJS_INTERFACE_READY: "pdfjs.interface.ready",
  CHECK_READY: "pdfjs.check.ready",
  PING: "pdfjs.ping",

  // 文档信息和导航
  GET_DOCUMENT_INFO: "pdfjs.getDocumentInfo",
  GET_DOCUMENT_OUTLINE: "pdfjs.getDocumentOutline",
  GET_CURRENT_PAGE: "pdfjs.getCurrentPage",
  GET_PAGE_COUNT: "pdfjs.getPageCount",
  GO_TO_PAGE: "pdfjs.goToPage",
  NAVIGATE_TO: "pdfjs.navigateTo",

  // 文本操作
  GET_TEXT: "pdfjs.getText",
  GET_PAGE_TEXT: "pdfjs.getPageText",
  FIND_TEXT: "pdfjs.findText",
  SET_TEXT_HIGHLIGHT: "pdfjs.setTextHighlight",
  CLEAR_TEXT_HIGHLIGHT: "pdfjs.clearTextHighlight",

  // 高亮操作
  GET_HIGHLIGHTS: "pdfjs.getHighlights",
  CLEAR_HIGHLIGHTS: "pdfjs.clearHighlights",
  CLEAR_HIGHLIGHT: "pdfjs.clearHighlight",

  // 注释操作
  GET_ANNOTATIONS: "pdfjs.getAnnotations",
  ADD_ANNOTATION: "pdfjs.addAnnotation",
  UPDATE_ANNOTATION: "pdfjs.updateAnnotation",
  DELETE_ANNOTATION: "pdfjs.deleteAnnotation",

  // 视图操作
  SET_ZOOM: "pdfjs.setZoom",
  ROTATE_PAGES: "pdfjs.rotatePages",

  // 文件操作
  DOWNLOAD_PDF: "pdfjs.downloadPdf",
  PRINT_PDF: "pdfjs.printPdf",

  // 事件通知（从PDF.js发送到父iframe）
  HIGHLIGHT_CREATED: "pdfjs.highlightCreated",
  HIGHLIGHT_REMOVED: "pdfjs.highlightRemoved",
  //   DOCUMENT_LOADED: "pdfjs.documentLoaded",
  PAGE_RENDERED: "pdfjs.pageRendered",
  PAGE_CHANGED: "pdfjs.pageChanged",
  ANNOTATION_ADDED: "pdfjs.annotationAdded",
  ANNOTATION_UPDATED: "pdfjs.annotationUpdated",
  ANNOTATION_DELETED: "pdfjs.annotationDeleted",
};

export { MessageType };
