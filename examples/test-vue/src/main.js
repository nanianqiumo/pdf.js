import { createApp } from "vue";
import ArcoVue from "@arco-design/web-vue";
import "@arco-design/web-vue/dist/arco.css";
import PdfViewerDemo from "./PdfViewerDemo.vue";

const app = createApp(PdfViewerDemo);

app.use(ArcoVue);

app.mount("#app");
