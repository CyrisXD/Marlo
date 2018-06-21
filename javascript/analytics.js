
//==========================================
//  Just counting number of users
//==========================================

const Analytics = require('electron-ga');
const analytics = new Analytics.default('UA-121109727-1');
analytics.send('screenview', { cd: 'Home' });
