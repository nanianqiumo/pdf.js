/**
 * Manages and dispatches events for an AnnotationEditorLayer.
 */
class AnnotationEditorLayerEventManager {
  #eventBus;

  #layer;

  /**
   * @param {Object} params
   * @param {EventBus} params.eventBus - The application's event bus.
   * @param {AnnotationEditorLayer} params.layer - The AnnotationEditorLayer instance.
   */
  constructor({ eventBus, layer }) {
    this.#eventBus = eventBus;
    this.#layer = layer;
  }

  /**
   * Dispatches an event when an editor is added.
   * @param {AnnotationEditor} editor - The editor that was added.
   */
  dispatchEditorAdded(editor) {
    if (!this.#eventBus || editor.editorType !== "highlight") {
      return;
    }

    if (editor.cancel_event) {
      return;
    }

    const text = editor.text;
    if (text) {
      this.#eventBus.dispatch("highlightCreated", {
        id: editor.id,
        page: editor.pageIndex + 1,
        text,
        color: editor.color,
      });
    }
  }

  /**
   * Dispatches an event when an editor is removed.
   * @param {AnnotationEditor} editor - The editor that was removed.
   */
  dispatchEditorRemoved(editor) {
    if (!this.#eventBus || editor.editorType !== "highlight") {
      return;
    }

    if (editor.cancel_event) {
      console.log(`取消事件: ${editor.id}`);
      return;
    }

    this.#eventBus.dispatch("highlightRemoved", {
      id: editor.id,
      page: editor.pageIndex + 1,
    });
  }

  /**
   * Dispatches an event when the layer is updated.
   * @param {Object} details - Details about the update.
   */
  dispatchLayerUpdated(details) {
    // if (!this.#eventBus) {
    //   return;
    // }
    // this.#eventBus.dispatch("annotationlayerupdated", {
    //   source: this,
    //   page: this.#layer.pageIndex + 1,
    //   details,
    // });
    // if (editor.constructor?.name === "HighlightEditor") {
    //   this.#dispatchHighlightEvent(editor, "highlightRemoved");
    // }
  }
}

export { AnnotationEditorLayerEventManager };
