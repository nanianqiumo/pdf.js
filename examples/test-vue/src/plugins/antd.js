import {
  Layout,
  Card,
  Button,
  Input,
  Select,
  Upload,
  Tabs,
  List,
  Badge,
  Tag,
  Space,
  Divider,
  Progress,
  Spin,
  Alert,
  Modal,
  Drawer,
  Tooltip,
  Popover,
  Tree,
  Empty,
  Switch,
  InputNumber,
  Form,
  Row,
  Col,
  Typography,
  ConfigProvider,
  message,
  notification,
} from "ant-design-vue";

// 图标
import {
  FileTextOutlined,
  HighlightOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  MenuOutlined,
  CloseOutlined,
  DownloadOutlined,
  PrinterOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  LeftOutlined,
  RightOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons-vue";

export function setupAntd(app) {
  // 注册组件
  app
    .use(Layout)
    .use(Card)
    .use(Button)
    .use(Input)
    .use(Select)
    .use(Upload)
    .use(Tabs)
    .use(List)
    .use(Badge)
    .use(Tag)
    .use(Space)
    .use(Divider)
    .use(Progress)
    .use(Spin)
    .use(Alert)
    .use(Modal)
    .use(Drawer)
    .use(Tooltip)
    .use(Popover)
    .use(Tree)
    .use(Empty)
    .use(Switch)
    .use(InputNumber)
    .use(Form)
    .use(Row)
    .use(Col)
    .use(Typography)
    .use(ConfigProvider);

  // 注册图标
  app
    .component("FileTextOutlined", FileTextOutlined)
    .component("HighlightOutlined", HighlightOutlined)
    .component("SearchOutlined", SearchOutlined)
    .component("InfoCircleOutlined", InfoCircleOutlined)
    .component("MenuOutlined", MenuOutlined)
    .component("CloseOutlined", CloseOutlined)
    .component("DownloadOutlined", DownloadOutlined)
    .component("PrinterOutlined", PrinterOutlined)
    .component("ZoomInOutlined", ZoomInOutlined)
    .component("ZoomOutOutlined", ZoomOutOutlined)
    .component("LeftOutlined", LeftOutlined)
    .component("RightOutlined", RightOutlined)
    .component("DeleteOutlined", DeleteOutlined)
    .component("EditOutlined", EditOutlined)
    .component("CopyOutlined", CopyOutlined)
    .component("FullscreenOutlined", FullscreenOutlined)
    .component("FullscreenExitOutlined", FullscreenExitOutlined);

  // 全局配置消息和通知
  app.config.globalProperties.$message = message;
  app.config.globalProperties.$notification = notification;
}
