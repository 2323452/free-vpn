chrome.storage.local.set({startTimer: 0}, function () { });
chrome.storage.local.set({pingDate: "0.0.0.0.0"}, function () { });

//chrome.runtime.onInstalled.addListener(function () {
//    chrome.tabs.create({
//       url: 'https://deeprism.com/en/donate',
//        active: true
//    });
//    return false;
//});