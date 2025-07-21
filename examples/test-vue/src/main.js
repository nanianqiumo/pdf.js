import { createApp } from "vue";
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css";
import PdfViewerDemo from "./PdfViewerDemo.vue";

const app = createApp(PdfViewerDemo);

app.use(Antd);

app.mount("#app");
