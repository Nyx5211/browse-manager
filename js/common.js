let OPERATIONS = {
  addUrlBlacklist: "URL加入黑名单（不再访问）",
  addUrlWhitelist: "URL加入白名单（不再统计）",
  addDomainBlacklist: "Domain加入黑名单（不再访问）",
  addDomainWhitelist: "Domain加入白名单（不再统计）",
};

let LS = {
  getItem: function (key) {
    return localStorage[key];
  },

  setItem: function (key, value) {
    localStorage[key] = value;
  },

  removeItem: function (key) {
    localStorage.removeItem(key);
  },

  forEach: function (callback) {
    Object.keys(localStorage).forEach(function (k) {
      callback(k, localStorage[k]);
    })
  }
};

let HISTORY = (function () {
  // 对设定时间内频繁访问做过滤，不计数
  let urlsBrowsedWithinSetTime = {};
  // 记录上次访问url，实现在对应页面打开黑名单网页时的拦截
  let tabsLastUrl = {};

  return {
    getTabLastUrl: function (tabId) {
      return tabsLastUrl[tabId];
    },

    setTabLastUrlWithCheck: function (tab) {
      let tabId = tab.id;
      let stableUrl = URL_UTILS.getStableUrl(tab.url);
      if (/^https?:\/\/www\.baidu\.com\/link\?/.test(stableUrl)) return;
      // 在跳转到其它页面前重新激活，以关闭时间作为最后访问时间。解决临时切换到其它标签再切回导致的次数增加
      if (this.tabLastUrlExists(tabId)) {
        this.cacheUrlWithinSetTime(this.getTabLastUrl(tabId));
      }
      tabsLastUrl[tabId] = stableUrl;
      console.debug(stableUrl + '  --> tab' + tabId);
    },

    deleteTabLastUrl: function (tabId) {
      delete tabsLastUrl[tabId];
    },

    tabLastUrlExists: function (tabId) {
      return tabsLastUrl.hasOwnProperty(tabId);
    },

    cacheUrlWithinSetTime: function (url) {
      let sequence = Date.now();
      urlsBrowsedWithinSetTime[url] = sequence;
      setTimeout(function () {
        if (urlsBrowsedWithinSetTime[url] === sequence)
          delete urlsBrowsedWithinSetTime[url];
      }, SETTINGS.getParam('diapause_time'));
    },

    browsedWithinSetTime: function (url) {
      return urlsBrowsedWithinSetTime.hasOwnProperty(url);
    }
  };
})();

let SETTINGS = {
  initialize: function () {
    this.touchParam('is_auto_save', true);
    this.touchParam('auto_save_thre', 5);
    this.touchParam('bookmark_title', '经常访问(BM)');
    this.touchParam('is_diapause', true);
    this.touchParam('is_prompt_duplicate', true);
    this.touchParam('diapause_time', 120000);
    this.touchParam('is_page_show', true);
    this.touchParam('csdn_auto_expand', true);
  },
  touchParam: function (paramName, defaultValue) {
    if (!this.getParam(paramName)) {
      this.setParam(paramName, defaultValue);
    }
  },
  setParam: function (paramName, value) {
    LS.setItem('SETTINGS:' + paramName, value);
  },
  getParam: function (paramName) {
    return LS.getItem('SETTINGS:' + paramName);
  },
  checkParam: function (paramName, expect) {
    return this.getParam(paramName) === expect;
  }
};


let BOOKMARK = {
  touchBookmarkFolder: function (callback) {
    let bookmarkTitle = SETTINGS.getParam('bookmark_title');
    chrome.bookmarks.search({title: bookmarkTitle}, function (results) {
      if (results.length >= 1) {
        callback(results[0].id);
      } else {
        chrome.bookmarks.create({
          parentId: '1',
          title: bookmarkTitle,
        }, function (bookmark) {
          notify_('已自动创建收藏夹 ' + bookmarkTitle);
          callback(bookmark.id);
        });
      }
    })
  },

  addBookmarkWithCheck: function (tab) {
    if (SETTINGS.checkParam('is_auto_save', 'false')) return;

    let stableUrl = URL_UTILS.getStableUrl(tab.url);

    let browsedTimes = COUNTING.getBrowsedTimes(stableUrl);
    if (browsedTimes === null) return;

    let doorsillToSave = parseInt(SETTINGS.getParam('auto_save_thre'));
    if (browsedTimes !== doorsillToSave) return;

    this.touchBookmarkFolder(function (bookmarkId) {
      chrome.bookmarks.search({url: stableUrl}, function (results) {
        if (results.length === 0) {
          chrome.bookmarks.create({
            parentId: bookmarkId,
            url: stableUrl,
            title: tab.title
          }, function (bookmark) {
            notify_('经常访问此网页,自动加入收藏夹:\n' + bookmark.title, 5000);
          })
        }
      })
    })
  },

  delBookmark: function (url) {
    chrome.bookmarks.search({url: url}, function (results) {
      results.forEach(function (result) {
        chrome.bookmarks.remove(result.id, function () {
          notify_('已同时从收藏夹中删除.');
        })
      })
    })
  }
};


let TABS = {
  registerTabs: function () {
    let this_ = this;
    chrome.tabs.query({}, function (tabs) {
      Array.from(tabs).forEach(function (tab) {
        HISTORY.setTabLastUrlWithCheck(tab);

        if (tab.active) {
          this_.setTabBadge(tab);
        }
      })
    });
  },

  sendMessageToTab: function (tabId, message) {
    // 进入异步，否则前台未准备好，无法接收消息
    setTimeout(function () {
      chrome.tabs.sendMessage(tabId, message);
    }, 200);
  },

  refreshActiveTabBadge: function () {
    let this_ = this;
    chrome.tabs.query(
      {currentWindow: true, active: true},
      function (tabArray) {
        this_.setTabBadge(tabArray[0]);
      }
    )
  },

  setTabBadge: function (tab) {
    if (!tab) return;

    chrome.tabs.get(tab.id, function (tab) {
      if (chrome.runtime.lastError) return;

      let stableUrl = URL_UTILS.getStableUrl(tab.url);
      let browseTimes = COUNTING.getBrowsedTimes(stableUrl);
      if (URL_UTILS.isWhitelist(stableUrl) || URL_UTILS.isBlacklist(stableUrl) || !browseTimes) {
        chrome.browserAction.setBadgeText({text: '', tabId: tab.id});
      } else {
        let bgColor = browseTimes >= parseInt(SETTINGS.getParam('auto_save_thre')) ?
          [255, 0, 0, 255] : [70, 136, 241, 255];
        chrome.browserAction.setBadgeBackgroundColor({color: bgColor, tabId: tab.id});
        chrome.browserAction.setBadgeText({text: '' + browseTimes, tabId: tab.id});
      }
    });
  }
};

let COUNTING = {
  increaseBrowseTimes: function (url) {
    let stableUrl = URL_UTILS.getStableUrl(url);
    let browseTimes = (this.getBrowsedTimes(stableUrl) || 0) + 1;
    this.setBrowsedTimes(stableUrl, browseTimes);
  },

  getBrowsedTimes: function (url) {
    let t = parseInt(LS.getItem(url));
    return isNaN(t) ? null : t;
  },

  setBrowsedTimes: function (url, times) {
    LS.setItem(url, times);
  }
};


let URL_UTILS = {
  moveToUrlObj: function (url) {
    try {
      return new URL(url);
    } catch (e) {
      // console.warn("Warning, new URL() failed, orgUrl:", url);
      return null;
    }
  },

  getStableUrl: function (url) {
    let stableUrl, urlObj, params;
    urlObj = this.moveToUrlObj(url);
    if (urlObj) {
      // 解决url中带有hash字段导致的页面重复计数问题。
      urlObj.hash = '';
      params = urlObj.searchParams;
      switch (urlObj.hostname) {
        case "www.youtube.com": {
          params.forEach(function (v, k, parent) {
            if (k !== 'v') params.delete(k);
          });
          break;
        }
        case "www.bilibili.com": {
          params.forEach(function (v, k, parent) {
            if (k !== 'p') params.delete(k);
          });
          break;
        }
        // ...
      }
    }

    stableUrl = (urlObj || url).toString().replace(/\/$/, "");
    url === stableUrl || console.debug(url + '  ==> ' + stableUrl);
    return stableUrl;
  },

  getDomain: function (url) {
    let arr = url.split("/");
    return arr[0] + "//" + arr[2];
  },

  isWhitelist: function (url) {
    let isDefaultWhitelist = /^chrome/.test(url)
      || /^https?:\/\/www\.baidu\.com/.test(url)
      || /^https?:\/\/www\.google\.com/.test(url);

    return isDefaultWhitelist
      || LS.getItem(url) === OPERATIONS.addUrlWhitelist
      || LS.getItem(this.getDomain(url)) === OPERATIONS.addDomainWhitelist;
  },

  isBlacklist: function (url) {
    if (/^chrome/.test(url)) return false;

    return LS.getItem(url) === OPERATIONS.addUrlBlacklist
      || LS.getItem(this.getDomain(url)) === OPERATIONS.addDomainBlacklist;
  },

  filterBlacklistUrl: function (tabId, url) {
    if (!this.isBlacklist(url)) return false;
    let noticeContent = '黑名单网站，不再访问';
    if (HISTORY.tabLastUrlExists(tabId)) {
      chrome.tabs.update(tabId, {url: HISTORY.getTabLastUrl(tabId)}, function (tab) {
        notify_(noticeContent);
        console.log(url, "黑名单网站，页面返回");
      });
    } else {
      chrome.tabs.remove(tabId);
      notify_(noticeContent);
      console.log(url, "黑名单网站，标签关闭");
    }
    return true;
  },

  isEffectual: function (tab) {
    let stableUrl = this.getStableUrl(tab.url);
    let tabId = tab.id;

    // 黑白名单
    if (this.isWhitelist(stableUrl) || this.isBlacklist(stableUrl)) {
      console.log(stableUrl, "黑白名单");
      return false;
    }

    // 'The Greate Suspender'类软件的跳转
    // 判断browseTimes，如果不在黑白名单，且以前未访问过，则为有效访问需要计数；
    if (/^chrome-extension/.test(HISTORY.getTabLastUrl(tabId)) && COUNTING.getBrowsedTimes(stableUrl)) {
      console.log(stableUrl, "跳转自chrome-extension");
      return false;
    }

    // 不包括刷新操作，刷新时url没有变化。
    if (HISTORY.getTabLastUrl(tabId) === stableUrl) {
      console.log(stableUrl, "地址未发生变化");
      return false;
    }

    // 忽略在diapause_time间的重复访问
    if (SETTINGS.checkParam('is_diapause', 'true') && HISTORY.browsedWithinSetTime(stableUrl)) {
      console.log(stableUrl, "在设置的忽略间隔中");
      if (SETTINGS.checkParam('is_prompt_duplicate', 'true'))
        TABS.sendMessageToTab(tab.id, {
          function: "DISPLAYER.display",
          paramsArray: ['DUPLICATE', {'font-size': '50px'}]
        });
      return false;
    }

    console.log(stableUrl, "计数有效");
    return true;
  }
};

let CONTENT = {
  displayBrowseTimesOnPageWithCheck: function (tab) {
    if (SETTINGS.checkParam('is_page_show', 'true')) {
      let browseTimes = COUNTING.getBrowsedTimes(URL_UTILS.getStableUrl(tab.url));
      let css = browseTimes > 3 ? {color: '#fe4a49'} : {};
      TABS.sendMessageToTab(tab.id, {
        function: "DISPLAYER.display",
        paramsArray: [browseTimes, css]
      });
    }
  },

  individuateSite: function (tab) {
    let stableUrl = URL_UTILS.getStableUrl(tab.url);
    if (SETTINGS.checkParam('csdn_auto_expand', 'true')
      && (stableUrl.match("^https://blog.csdn.net") || stableUrl.match("^https://.*.iteye.com"))) {
      TABS.sendMessageToTab(tab.id, {
        function: "autoExpandContent"
      })
    }
  },
};


function notify_(content, timeout = 3000, notificationId = '') {
  let opt = {
    type: 'basic',
    title: chrome.i18n.getMessage('extension_name'),
    message: content,
    iconUrl: 'images/icon48.png',
    requireInteraction: true,
  };
  chrome.notifications.create(notificationId, opt, function (id) {
    if (timeout !== 0) {
      setTimeout(function () {
        chrome.notifications.clear(id);
      }, timeout);
    }
  });
}

function createContextMenus() {
  Object.values(OPERATIONS).forEach(function (title) {
    chrome.contextMenus.create({
      type: 'normal',
      title: title, id: "Menu-" + title, contexts: ['all']
    });
  });
}

function checkForUpdates() {
  let local = chrome.runtime.getManifest().version;
  fetch('https://raw.githubusercontent.com/ZDL-Git/browse-manager/master/manifest.json')
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {
      let newest = json.version;
      if (LS.getItem(newest) !== 'checked' && local !== newest) {
        LS.setItem(newest, 'checked');
        let content = `检测到新版本 ${newest}，本地版本 ${local}，点此更新。`;
        let link = 'https://github.com/ZDL-Git/browse-manager/tree/master/distribution/crx';
        notify_(content, 0, link);
      }
    });
}
