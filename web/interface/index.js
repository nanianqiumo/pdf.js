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
 * PDF.js 接口模块
 * 该模块提供了与 PDF.js 查看器的通信接口和相关组件
 *
 * 主要组件：
 * - EnhancedPDFViewer: 增强型PDF查看器，提供更高级的抽象和简化的API
 * - MessageType: 消息类型枚举，定义所有的通信消息类型
 * - PDFJSInterface: PDF.js通信接口，处理与嵌入PDF.js查看器的通信
 */
import { EnhancedPDFViewer } from "./enhanced_viewer.js";
import { EventEmitter } from "./event_emitter.js";
import { MessageType } from "./message_type.js";
import { PDFJSInterface } from "./pdf_js_interface.js";
import { TestPrivateFields } from "./test_private_fields.js";

// 导出所有公共组件
export {
  EnhancedPDFViewer,
  EventEmitter,
  MessageType,
  PDFJSInterface,
  TestPrivateFields,
};
