module.exports = function(self, options) {
  self.pushAssets = function() {
    if (self.apos.modules['apostrophe-assets'].options.lean === true && self.options.pushMoment !== false) {
      self.pushAsset('script', 'vendor/moment', { when: 'always' });
    }
    if (self.options.pushClndr !== false) {
      self.pushAsset('script', 'vendor/clndr.min', { when: 'always' });
    }
    self.pushAsset('stylesheet', 'always', { when: 'always' });
    self.pushAsset('script', 'always', { when: 'always' });
  };
};
