import { getData } from './lib/ajax';

const reg = /pan\.baidu\.com\/s\/[0-9a-zA-Z-_]{6,24}/g;

let panUrls: string[] = [];
let _observer: MutationObserver | null = null;

function observerHTML() {
  const targetNode = document.getRootNode();

  const callback = function (mutationsList: any, observer: any) {
    matchUrl();
  };
  // 创建一个观察器实例并传入回调函数
  // observe函数会对传入的节点以及所需观察的配置项进行观察
  // 发生改变则回调callback函数
  _observer = new MutationObserver(callback);

  // 以上述配置开始观察目标节点
  _observer.observe(targetNode, { childList: true, subtree: true });
}

function matchUrl() {
  let matchURLs = $('body').html().match(reg)?.slice();

  matchURLs = Array.from(new Set(matchURLs));

  // 排除已渲染的链接
  const disjointUrl = matchURLs.filter((value) => !panUrls.includes(value));
  panUrls = Array.from(new Set([...panUrls, ...matchURLs]));

  const urlPromises = disjointUrl.map((url) => {
    return new Promise((resolve, reject) => {
      getData('https://' + url)
        .then((res: Document) => {
          const isExpire = res.head.querySelector('title')?.text.includes('不存在');
          resolve(isExpire);
        })
        .catch((error) => {
          resolve(true);
        });
    });
  });
  Promise.all(urlPromises)
    .then((res: any[]) => {
      const list = disjointUrl.filter((value, index) => res[index]);
      list.length > 0 && HightLigntExpireNodes(list);
    })
    .catch((error) => {
      console.error('Error occurred:', error);
    });
}

const app = () => {
  // matchUrl();
  observerHTML();
};

function HightLigntExpireNodes(this: any, list: string[]) {
  list.forEach((txt) => {
    // 查询所有包含指定文本的元素的最后一个元素
    const elments = $(':contains(' + txt + ')').filter(function () {
      return $(this).find(':contains(' + txt + ')').length === 0;
    });

    const reg = new RegExp('(https://)?' + txt, 'g');

    elments?.html(function (i: any, html: string) {
      return html.replace(reg, `<span title="链接不存在" style=" color: red; text-decoration: underline;">$&</span>`);
    });
  });
}

export default app;
