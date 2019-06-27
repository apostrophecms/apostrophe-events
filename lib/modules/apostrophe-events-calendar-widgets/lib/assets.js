module.exports = function(self, options) {
  self.pushAssets = function() {
    self.pushAsset('script', 'vendor/clndr.min', { when: 'always' });
    self.pushAsset('script', 'always', { when: 'always' });
  	self.pushAsset('stylesheet', 'calendar', { when: 'always' });
  }
}