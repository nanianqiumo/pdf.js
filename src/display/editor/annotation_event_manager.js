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
    if (!this.#eventBus) {
      return;
    }

    // Specific event for your "highlightcreated" requirement
    if (editor.constructor?.name === "HighlightEditor") {
      this.#dispatchHighlightEvent(editor, "highlightCreated");
    }
  }

  #dispatchHighlightEvent(editor, eventName) {
    if (!this.#eventBus || editor.constructor?.name !== "HighlightEditor") {
      return;
    }
    const text = editor.text; // Assuming HighlightEditor has this method
    if (text) {
      this.#eventBus.dispatch(eventName, {
        id: editor.id,
        page: this.#layer.pageIndex + 1,
        text,
      });
    }
  }

  /**
   * Dispatches an event when an editor is removed.
   * @param {AnnotationEditor} editor - The editor that was removed.
   */
  dispatchEditorRemoved(editor) {
    if (!this.#eventBus) {
      return;
    }
    // this.#eventBus.dispatch("editorremoved", {
    //   source: this,
    //   page: this.#layer.pageIndex + 1,
    //   editorId: editor.id,
    //   editorType: editor.constructor.name,
    // });

    if (editor.constructor?.name === "HighlightEditor") {
      this.#dispatchHighlightEvent(editor, "highlightRemoved");
    }
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
