# HappyHorse by Ace Data Cloud：OpenClaw 独立插件

**发布候选，尚未在独立商店条目公开，安装命令需待审核发布后才可用。** 本包只注册HappyHorse的原生video能力、3个可选工具及使用Skill，不自动替换聊天服务商，也不需要安装Ace合集。非HappyHorse官方背书。

1. 发布后在[ClawHub插件](https://clawhub.ai/plugins)搜索HappyHorse，确认作者acedatacloud、包@acedatacloud/happyhorse-openclaw，再安装。
2. 注册/登录[Ace应用列表](https://platform.acedata.cloud/console/applications?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=happyhorse_openclaw_readme_api_key)，打开General application；没有则初始化。复制API Key，或Manage Keys→Create创建独立密钥。核对HappyHorse权限、生成及查询API、有效期、用量限制和[实时价格/余额](https://platform.acedata.cloud/models?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=happyhorse_openclaw_readme_pricing)。只复制token，不加Bearer，不使用平台管理Token。
3. 运行`openclaw models auth login --provider ace-happyhorse --method api-key`，在该服务的交互提示粘贴；可用专属环境变量`ACEDATA_HAPPYHORSE_API_KEY`或`plugins.entries.ace-happyhorse.config.apiKey`。
4. 先用`openclaw plugins inspect ace-happyhorse --runtime --json`检查安装。确认预算后再发一次video请求；该操作收费。异步保存task_id，使用`ace_service_happyhorse_task_retrieve`查询同一ID，等待终态后获取结果；超时不重复生成。
5. 401核对token、权限/到期、限制和余额；来源警告不能靠关闭安全措施消除。仅按需允许工具，删除/归档需要confirm=true，安装同意不等于无限付费。托管实例默认仅初始化聊天模型，额外媒体插件要单独安装/授权，部署时长和API费分开。

真实平台Key截图、原生界面参考图的来源/日期及完整参数/结果/问题说明见[英文图文指南](README.md)。参考图不是本插件实测截图，当前没有宣称完整付费调用成功。
