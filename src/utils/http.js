const __config = require('./config');

class HttpService {
  constructor() {
    Object.assign(this, {
      $basePath: __config.basePath,
    });
    this.__init();
  }

  /**
   * __init
   */
  __init() {
    this.__initDefaults();
    this.__initMethods();
  }

  /**
   * __initDefaults
   */
  __initDefaults() {
    // 发起请求所支持的方法
    this.instanceSource = {
      method: [
        'OPTIONS',
        'GET',
        'HEAD',
        'POST',
        'PUT',
        'DELETE',
        'TRACE',
        'CONNECT',
      ],
    };
  }

  /**
   * 遍历对象构造方法，方法名以小写字母+后缀名
   */
  __initMethods() {
    for (let key in this.instanceSource) {
      this.instanceSource[key].forEach((method, index) => {
        this[method.toLowerCase()] = (...args) =>
          this.__defaultRequest(method, ...args);
      });
    }
  }

  /**
   * 以wx.request作为底层方法
   * @param {String} method 请求方法
   * @param {String} url    接口地址
   * @param {Object} params 请求参数
   * @param {Object} header 设置请求的 header
   * @param {String} dataType 请求的数据类型
   */
  __defaultRequest(
    method = '',
    url = '',
    params = {},
    header = {},
    dataType = 'json'
  ) {
    const $header = Object.assign({}, this.setHeaders(), header);
    const $url = this.setUrl(url);

    // 注入拦截器
    const chainInterceptors = (promise, interceptors) => {
      for (let i = 0, len = interceptors.length; i < len; ) {
        let resolveFn = interceptors[i++];
        let rejectFn = interceptors[i++];
        promise = promise.then(resolveFn, rejectFn);
      }
      return promise;
    };
    //加入token信息
    params.AccessToken = wx.getStorageSync('token');
    // 请求参数配置
    const $config = {
      url: $url,
      data: params,
      header: $header,
      method: method,
      dataType: dataType,
    };

    let requestInterceptors = [];
    let responseInterceptors = [];
    let reversedInterceptors = this.setInterceptors();
    let promise = this.__resolve($config);

    // 缓存拦截器
    reversedInterceptors.forEach((item, index) => {
      if (item.request || item.requestError) {
        requestInterceptors.push(item.request, item.requestError);
      }
      if (item.response || item.responseError) {
        responseInterceptors.unshift(item.response, item.responseError);
      }
    });

    // 注入请求拦截器
    promise = chainInterceptors(promise, requestInterceptors);

    // 发起HTTPS请求
    promise = promise.then(this.__http);

    // 注入响应拦截器
    promise = chainInterceptors(promise, responseInterceptors);

    // 接口调用成功，res = {data: '开发者服务器返回的内容'}
    promise = promise.then(res => res.data, err => err);

    return promise;
  }

  /**
   * __http - wx.request
   */
  __http(obj) {
    return new Promise((resolve, reject) => {
      obj.success = res => resolve(res);
      obj.fail = res => reject(res);
      wx.request(obj);
    });
  }

  /**
   * __resolve
   */
  __resolve(res) {
    return new Promise((resolve, reject) => {
      resolve(res);
    });
  }

  /**
   * __reject
   */
  __reject(res) {
    return new Promise((resolve, reject) => {
      reject(res);
    });
  }

  /**
   * 设置请求路径
   */
  setUrl(url) {
    return `${this.$basePath}${url}`;
  }

  /**
   * 设置请求的 header , header 中不能设置 Referer
   */
  setHeaders() {
    return {
      Accept: 'application/json',
      'Content-type': 'application/json',
      // 'Content-Type': 'application/x-www-form-urlencoded',
      // 'Authorization': 'Bearer ' + wx.getStorageSync('token')
    };
  }

  /**
   * 设置request拦截器
   */
  setInterceptors() {
    return [
      {
        request: request => {
          request.header = request.header || {};
          request.requestTimestamp = new Date().getTime();
          wx.showToast({
            title: '加载中',
            icon: 'loading',
            duration: 10000,
            mask: !0,
          });
          return request;
        },
        requestError: requestError => {
          wx.hideToast();
          return requestError;
        },
        response: response => {
          response.responseTimestamp = new Date().getTime();
          if (
            response.statusCode == 401 ||
            response.statusCode == 403 ||
            (response.data.code == -1 &&
              response.data.tips == '云客户端连接失败')
          ) {
            wx.removeStorageSync('token');
            wx.removeStorageSync('userinfo');
            wx.redirectTo({
              url: '/views/login/login?isfail=true',
            });
          }
          wx.hideToast();
          return response;
        },
        responseError: responseError => {
          wx.hideToast();
          return responseError;
        },
      },
    ];
  }
}

module.exports = HttpService;
