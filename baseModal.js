const ESize = {
  xs: "xs",
  md: "md",
  lg: "lg",
  xl: "xl",
};

class ModalComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    // Create event emitter
    this.emitter = new EventTarget();

    // Initialize refs
    this.modalRef = null;
    this.modalBackdropRef = null;
    this.elementBody = null;
    this.indexKey = 1;

    // Bind methods

    this.scrollHandle = this.scrollHandle.bind(this);
    this.modalMask = this.modalMask.bind(this);
    this.modalClear = this.modalClear.bind(this);
  }

  static get observedAttributes() {
    return [
      "is-show-modal",
      "is-body-padding",
      "is-show-footer",
      "width",
      "height",
      "size",
    ];
  }

  get cssStyle() {
    const width = this.getAttribute("width");
    switch (this.getAttribute("size")) {
      case ESize.xs:
        return { width: width ?? "300px" };
      case ESize.lg:
        return { width: width ?? "1024px" };
      case ESize.xl:
        return { width: width ?? "calc(100vw - 55px)" };
      case ESize.md:
      default:
        return { width: width ?? "600px" };
    }
  }

  get cssHeightStyle() {
    return { height: this.getAttribute("height") ?? "" };
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    this.modalClear();
    this.modalMask();
    this.removeEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === "is-show-modal") {
        console.log("觸發modal狀態改變", name, newValue);
        this.handleModalVisibility(newValue === "true");
      }
      this.render();
    }
  }

  setupEventListeners() {
    this.emitter.addEventListener("defaultSet", () => {
      if (this.elementBody) {
        const scrollEvent = new Event("scroll");
        this.elementBody.dispatchEvent(scrollEvent);
      }
    });
  }

  removeEventListeners() {
    this.querySelector(".close")?.removeEventListener("click");
    this.querySelector(".btn-primary")?.removeEventListener("click");
    this.elementBody?.removeEventListener("scroll", this.scrollHandle);
  }

  scrollHandle(e) {
    this.emitter.dispatchEvent(new CustomEvent("scroll", { detail: e }));
  }

  modalMask() {
    // 獲取所有 modal 組件實例
    const modalComponents = document.getElementsByTagName("base-modal");
    console.log("所有 modal 組件實例", modalComponents);

    // 先隱藏所有 backdrop
    [...modalComponents].forEach((modal) => {
      console.log("開始迴圈", [...modalComponents]);
      const backdrop = modal.shadowRoot.querySelector(".nmodal-backdrop");
      console.log("backdrop", backdrop);
      if (backdrop) {
        backdrop.style.display = "none";
      }
    });

    setTimeout(() => {
      let lastVisibleModal = null;

      // 尋找最後一個顯示的 modal
      [...modalComponents].forEach((modal) => {
        const modalDiv = modal.shadowRoot.querySelector(".nmodal");
        if (modalDiv?.style?.display === "block") {
          lastVisibleModal = modal;
        }
      });

      // 如果找到顯示的 modal，顯示其對應的 backdrop
      if (lastVisibleModal) {
        const backdrop =
          lastVisibleModal.shadowRoot.querySelector(".nmodal-backdrop");
        if (backdrop) {
          backdrop.style.display = "block";
        }
      }
    }, 0);
  }

  modalClear() {
    this.modalBackdropRef?.remove();
    this.modalRef?.remove();
  }

  handleModalVisibility(isVisible) {
    const htmlElement = document.getElementsByTagName("html")[0];

    setTimeout(() => {
      if (isVisible) {
        htmlElement.classList.add("modal-open");
      } else if (document.getElementsByClassName("nmodel-open").length === 0) {
        htmlElement.classList.remove("modal-open");
      }

      this.indexKey = document.querySelectorAll(".nmodel-open").length;
      this.modalMask();
    }, 0);
  }

  render() {
    const isShowModal = this.getAttribute("is-show-modal") === "true";
    const isBodyPadding = this.getAttribute("is-body-padding") !== "false";
    const isShowFooter = this.getAttribute("is-show-footer") !== "false";

    // 在外部添加樣式而不是在組件內部
    if (!document.getElementById("modal-component-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "modal-component-styles";
      styleSheet.textContent = `
        .nmodal {
          overflow-y: auto !important;
        }
        
        .ncontent {
          overflow: auto;
          max-height: calc(100vh - 55px);
        }
        
        .nbodyft {
          overflow: auto;
          max-height: calc(100vh - 165px);
        }
        
        .nbody {
          overflow: auto;
          max-height: calc(100vh - 111px);
        }
        
        .nflex {
          display: flex;
        }
        
        .nflex-1 {
          flex: 1;
        }
        
        .ngrow-prefix {
          flex-basis: 400px;
        }
        
        .ngrow-suffix {
          flex-basis: 200px;
        }
      `;
      document.head.appendChild(styleSheet);
    }

    const template = `
        <link rel="stylesheet" href="./css/bootstrap.min.css">
    <link rel="stylesheet" href="./css/pixeladmin.min.css">
    <link rel="stylesheet" href="./css/clean.min.css">
    <link rel="stylesheet" href="./css/font-awesome.min.css">
    <link rel="stylesheet" href="./css/widgets.min.css">
      <div class="nmodal-backdrop modal-backdrop fade in" style="display: none; z-index: 1080 !important" 
           ${isShowModal ? "" : "hidden"}></div>
      <div class="nmodal modal modal-open fade in ${
        isShowModal ? "nmodel-open" : ""
      }"
           style="display: ${isShowModal ? "block" : "none"}"
           ${isShowModal ? "" : "hidden"}>
        <div class="modal-dialog" style="width: ${this.cssStyle.width}">
          <div class="modal-content ncontent">
            <div class="modal-header">
              <button type="button"  class="closeModal close" data-dismiss="modal">x</button>
              <h4 class="modal-title">
                <slot name="header"></slot>
              </h4>
            </div>
            <div class="nflex">
              <div class="ngrow-prefix ${isBodyPadding ? "modal-body" : ""} ${
      isShowFooter ? "nbodyft" : "nbody"
    }">
                <slot name="prefix"></slot>
              </div>
              <div class="nflex-1 ${isBodyPadding ? "modal-body" : ""} ${
      isShowFooter ? "nbodyft" : "nbody"
    }"
                   style="height: ${this.cssHeightStyle.height}">
                <slot name="body">我是預設body</slot>
              </div>
              <div class="ngrow-suffix ${isBodyPadding ? "modal-body" : ""} ${
      isShowFooter ? "nbodyft" : "nbody"
    }">
                <slot name="suffix"></slot>
              </div>
            </div>
            ${
              isShowFooter
                ? `
              <div class="modal-footer">
                <slot name="footer">
                  <button type="button"  class="btn closeModal" data-dismiss="modal">Close</button>
                  <button type="button"  class="btn btn-primary closeModal">Confirm</button>
                </slot>
              </div>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.innerHTML = template;

    // Set up refs after rendering
    this.modalBackdropRef = this.shadowRoot.querySelector(".nmodal-backdrop");
    this.modalRef = this.shadowRoot.querySelector(".nmodal");
    this.elementBody = this.shadowRoot.querySelector(".nflex-1");

    // Add event listeners
    const elements = this.shadowRoot.querySelectorAll(".closeModal");
    elements.forEach((element) => {
      element.addEventListener("click", () => {
        this.setAttribute("is-show-modal", "false"); // 關閉 Modal
      });
    });

    this.elementBody?.addEventListener("scroll", this.scrollHandle);
  }
}

customElements.define("base-modal", ModalComponent);
