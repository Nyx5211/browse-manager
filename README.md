# Browse Manager
### 项目说明

Chrome扩展：网址/域名拉黑，访问次数统计，自动收藏。【这是编程早期的作品，不过功能对我自己很有用，可能对跟我一样需求的人来说是个很不错的软件。由于时间精力原因非bug或者重要新功能不会频繁更新】

### Idea来源

在搜索某些资源，或者查找解决某些bug的方法的时候，会来回不断的翻阅一些网站，经历很久的时间，有的问题甚至半年后还需要重新来过，那些曾经访问过且证明没有任何意义的网页，因为一个“优秀的”标题而导致再次浪费我们的时间。所以为什么我们不能统计它们，拉黑它们呢？

### 安装方法

<img src="https://user-images.githubusercontent.com/30430217/54299594-2ebe3700-45f6-11e9-84a4-90ce4fb38c28.GIF"
 width="700" />
<br/>

### 当前功能

* 黑名单：拉黑地址或域名，在页面右键-Browse Manager-URL不再访问(黑名单)/Domain不再访问(黑名单)；
* 统计访问次数：统计除白名单外每个网页已经访问过的次数，在图标上显示；
* 白名单：为了避免无用的统计，提供了白名单。页面右键将地址或域名加入白名单，不再统计、显示访问次数。chrome:/www.baidu.com/www.google.com开头的网页默认在白名单；
* 自动收藏：在管理界面（单击图标）设置自动收藏次数及收藏夹名称，当达到访问次数后网页会被自动收藏到指定收藏夹中，图标上的数字会变为红色。前期手动收藏过的网页不会处理。收藏夹会自动创建，如果已存在会直接使用，不会导致覆盖。此功能主要基于：如果一个网页需要频繁访问且未被拉入黑名单及证明其重要性，可配合Alfred等软件使用。
