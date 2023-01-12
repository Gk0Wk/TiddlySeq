/*\
title: $:/core/modules/startup/hook-jquery.js
type: application/javascript
module-type: startup

Hook jQuery object to wiki.

\*/
(function () {
  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  // Export name and synchronous status
  exports.name = "hook-lodash";
  exports.platforms = ["browser"];
  exports.after = ["load-modules"];
  exports.synchronous = true;
  exports.startup = function () {
    try {
      window._ = require("$:/plugins/Gk0Wk/lodash/lodash.min.js")._;
    } catch (e) {
      console.error(e);
    }
  };
})();
