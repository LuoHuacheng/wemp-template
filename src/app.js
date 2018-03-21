const HttpService = require('./utils/http');

App({
  onLaunch: function() {
    console.log('App Launch');
  },
  onShow: function() {
    console.log('App Show');
  },
  onHide: function() {
    console.log('App Hide');
  },
  $http: new HttpService(),
});
