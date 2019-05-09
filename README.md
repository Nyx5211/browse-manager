# Browse Manager
### 项目说明

Chrome扩展：网址/域名拉黑，访问次数统计，自动收藏。【这是编程早期的作品，不过功能对我自己很有用，可能对跟我一样需求的人来说是个很不错的软件。】

项目主页：https://github.com/ZDL-Git/browse-manager

### Idea来源

在搜索某些资源，或者查找解决某些bug的方法的时候，会来回不断地翻阅一些网站，经历很久的时间，有的问题甚至半年后还需要重新来过，那些曾经访问过且证明没有任何意义的网页，因为一个“优秀的”标题而导致再次浪费我们的时间。所以为什么我们不能统计它们，拉黑它们呢？

### 当前功能

<img src="https://github.com/ZDL-Git/resources-store/blob/master/images/popup.jpg?raw=true" width="40%"/>

* 拉黑地址或域名：黑名单，在页面右键-Browse Manager-URL不再访问(黑名单)/Domain不再访问(黑名单)；
* 统计访问次数：统计除白名单外每个网页已经访问过的次数，在图标上显示；
* 白名单：为了避免无用的统计，提供了白名单。页面右键将地址或域名加入白名单，不再统计、不再显示访问次数。"chrome:"/"www.baidu.com"/"www.google.com"开头的网页默认在白名单；
* 自动收藏：在管理界面（单击图标）设置自动收藏次数及收藏夹名称，当达到访问次数后网页会被自动收藏到指定收藏夹中，图标上的数字会变为红色。前期手动收藏过的网页不会处理。收藏夹会自动创建，如果已存在会直接使用，不会导致覆盖。此功能主要基于：如果一个网页需要频繁访问且未被拉入黑名单及证明其重要性，可配合Alfred等软件使用。

### 安装方法

项目当前暂无提交Chrome Store的计划，请使用以下方式安装。

下载地址：https://github.com/ZDL-Git/browse-manager/releases/latest

方法一：按gif步骤选择最新版本安装

<img src="https://github.com/ZDL-Git/Resource-store/blob/master/gifs/Kapture%202019-04-13%20at%2016.36.40.GIF" width="100%" />

注：完成安装后请将开发者模式关闭，避免Chrome的频繁提示（Windows平台）。

方法二：clone仓库，平时可更新获取最新的版本。

如有问题可提[Github issue](https://github.com/ZDL-Git/browse-manager/issues)，可email:zdl_daily@163.com

### 注意事项

* 由于是在后台js中listen事件，黑名单功能当前模式：在新tab打开黑名单网页时，会自动将这个tab关闭掉；在当前tab打开黑名单网页时，会自动后退到上一个非黑名单网页。如果环境对tab的管理要求严格，请谨慎使用。

* 打开“在页面显示访问次数”功能后，程序会在访问的页面临时嵌入一个fixed定位的div，使用完后会接着自动remove掉。

* 将网页加入黑名单时，如果其在收藏夹中，则会自动删除收藏。

* 目前仍保留了一种临时访问黑名单网页的方式：1.必须先新建个tab；2.输入网址访问。
