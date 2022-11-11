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
  exports.name = "hook-jquery";
  exports.platforms = ["browser"];
  exports.after = ["load-modules"];
  exports.synchronous = true;
  exports.startup = function () {
    try {
      window.jQuery =
        window.$ = require("$:/plugins/Gk0Wk/jQuery/jquery.min.js");
    } catch (e) {
      console.error(e);
    }
  };
})();
