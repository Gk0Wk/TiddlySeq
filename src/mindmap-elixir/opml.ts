function filledString(ch, ct) {
  let s = '';
  for (let i = 0; i < ct; i++) {
    s += ch;
  }
  return s;
}
function encodeXml(s) {
  if (s === undefined) {
    return '';
  } else {
    const charMap = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&' + 'quot;',
    };
    s = s.toString();
    s = s.replace(/\u00A0/g, ' ');
    let escaped = s.replace(/[<>&"]/g, function (ch) {
      return charMap[ch];
    });
    return escaped;
  }
}
function xmlCompile(xmltext) {
  //3/27/17 by DW
  return new DOMParser().parseFromString(xmltext, 'text/xml');
}
function xmlGatherAttributes(adrx: Element, theTable: Record<string, any>) {
  if (adrx.attributes !== undefined) {
    for (const p of adrx.getAttributeNames()) {
      theTable[p] = adrx.getAttribute(p);
    }
  }
}
function xmlGetAttribute(adrx, name) {
  return $(adrx).attr(name);
}
const xmlGetAddress = (adrx: Document, name: string) =>
  adrx.querySelector(name);
function xmlGetSubValues(adrx: Element) {
  const values: Record<string, any> = {};
  for (const child of Array.from(adrx.children)) {
    values[child.tagName] = child.textContent;
  }
  return values;
}
function xmlGetNodeNameProp(adrx: Element) {
  //12/10/13 by DW
  return $(adrx).prop('nodeName');
}
const xmlHasSubs = (adrx: Element) => adrx.children.length > 0;

const outlineToJson = (adrx: Element, nameOutlineElement = 'outline') => {
  const theOutline: Record<string, any> = {};
  xmlGatherAttributes(adrx, theOutline);
  if (xmlHasSubs(adrx)) {
    theOutline.subs = [];
    for (const child of Array.from(adrx.children)) {
      if (child.tagName !== nameOutlineElement) {
        continue;
      }
      theOutline.subs.push(outlineToJson(child, nameOutlineElement));
    }
  }
  return theOutline;
}
function markdownToOutline(mdtext, options) {
  let theOutline = {
    opml: {
      head: {},
      body: {
        subs: new Array(),
      },
    },
  };

  if (options === undefined) {
    //1/12/22 by DW
    options = new Object();
  }
  if (options.flAddUnderscores === undefined) {
    options.flAddUnderscores = true;
  }

  mdtext = mdtext.toString();
  let lines = mdtext.split('\n'),
    lastlevel = 0,
    lastnode = undefined,
    currentsubs = theOutline.opml.body.subs,
    stack = new Array();
  lines.forEach(function (theLine) {
    let thislevel = 0,
      flInsert = true;
    while (theLine.length > 0) {
      if (theLine[0] != '\t') {
        break;
      }
      thislevel++;
      theLine = stringDelete(theLine, 1, 1);
    }
    if (beginsWith(theLine, '- ')) {
      theLine = stringDelete(theLine, 1, 2);
    } else {
      //is the line an attribute?
      if (stringContains(theLine, ':: ')) {
        let parts = theLine.split(':: ');
        if (lastnode !== undefined) {
          //1/8/22 by DW
          let name = options.flAddUnderscores ? '_' + parts[0] : parts[0]; //1/12/22 by DW
          lastnode[name] = parts[1];
          //lastnode ["_" + parts [0]] = parts [1];
        }
        flInsert = false;
      }
    }
    if (thislevel > lastlevel) {
      stack.push(currentsubs);
      lastnode.subs = new Array();
      currentsubs = lastnode.subs;
    } else {
      if (thislevel < lastlevel) {
        let ctpops = lastlevel - thislevel;
        for (let i = 1; i <= ctpops; i++) {
          currentsubs = stack.pop();
        }
      }
    }

    if (flInsert) {
      let newnode = {
        text: theLine,
      };
      currentsubs.push(newnode);
      lastnode = newnode;
      lastlevel = thislevel;
    }
  });
  return theOutline;
}
function outlineToMarkdown(theOutline) {
  //1/3/22 by DW
  //Changes
  //1/3/22; 6:03:00 PM by DW
  //Generate markdown text from the indicated outline structure
  //that can be read by LogSeq and compatible apps.
  let mdtext = '',
    indentlevel = 0;
  function add(s) {
    mdtext += filledString('\t', indentlevel) + s + '\n';
  }
  function addAtts(atts) {
    for (let x in atts) {
      if (x != 'subs' && x != 'text') {
        if (beginsWith(x, '_')) {
          add(stringDelete(x, 1, 1) + ':: ' + atts[x]);
        }
      }
    }
  }
  function dolevel(theNode) {
    theNode.subs.forEach(function (sub) {
      add('- ' + sub.text);
      addAtts(sub);
      if (sub.subs !== undefined) {
        indentlevel++;
        dolevel(sub);
        indentlevel--;
      }
    });
  }
  //addAtts (theOutline.opml.head);
  dolevel(theOutline.opml.body);
  return mdtext;
}

const opmlParse = (opmltext: string) => {
  let xstruct: Document;
  try {
    xstruct = xmlCompile(opmltext);
  } catch (err) {
    console.error('opmlParse: invalid XML.');
    throw err;
  }

  return {
    opml: {
      head: xmlGetSubValues(xmlGetAddress(xstruct, 'head')!),
      body: outlineToJson(xmlGetAddress(xstruct, 'body')!),
    },
  };
}
function opmlStringify(theOutline) {
  //returns the opmltext for the outline -- 8/6/17 by DW
  let opmltext = '',
    indentlevel = 0;
  function add(s) {
    opmltext += filledString('\t', indentlevel) + s + '\n';
  }
  function addSubs(subs) {
    if (subs !== undefined) {
      for (let i = 0; i < subs.length; i++) {
        let sub = subs[i],
          atts = '';
        for (let x in sub) {
          if (x != 'subs') {
            atts += ' ' + x + '="' + encodeXml(sub[x]) + '"';
          }
        }
        if (sub.subs === undefined) {
          add('<outline' + atts + ' />');
        } else {
          add('<outline' + atts + ' >');
          indentlevel++;
          addSubs(sub.subs);
          add('</outline>');
          indentlevel--;
        }
      }
    }
  }
  add('<?xml version="1.0" encoding="ISO-8859-1"?>');
  add('<opml version="2.0">');
  //do head section
  add('<head>');
  indentlevel++;
  for (let x in theOutline.opml.head) {
    add('<' + x + '>' + theOutline.opml.head[x] + '</' + x + '>');
  }
  add('</head>');
  indentlevel--;
  //do body section
  add('<body>');
  indentlevel++;
  addSubs(theOutline.opml.body.subs);
  add('</body>');
  indentlevel--;
  add('</opml>');
  indentlevel--;
  //console.log ("opmlify: opmltext == \n" + opmltext);
  return opmltext;
}
function getOutlineHtml(theOutline) {
  let htmltext = '';
  indentlevel = 0;
  function add(s) {
    htmltext += filledString('\t', indentlevel) + s + '\n';
  }
  function addSubsHtml(node) {
    add('<ul>');
    indentlevel++;
    node.subs.forEach(function (sub) {
      add('<li>' + sub.text + '</li>');
      if (sub.subs !== undefined) {
        addSubsHtml(sub);
      }
    });
    add('</ul>');
    indentlevel--;
  }
  addSubsHtml(theOutline.opml.body);
  return htmltext;
}
function visitAll(theOutline, callback) {
  function visitSubs(theNode) {
    if (theNode.subs !== undefined) {
      for (let i = 0; i < theNode.subs.length; i++) {
        let theSub = theNode.subs[i];
        if (!callback(theSub)) {
          return false;
        }
        visitSubs(theSub);
      }
    }
    return true;
  }
  visitSubs(theOutline.opml.body);
}

function readOutline(urlOpmlFile, options, callback) {
  //9/24/21 by DW
  //Changes
  //9/27/21; 1:57:08 PM by DW
  //If options is not defined, initialize it to a default object.
  //9/24/21; 1:51:52 PM by DW
  //Read the outline over HTTP. If options.flSubscribe is present and true, we set up a websockets connection if the outline supports it, and calll back when it updates.
  let mySocket = undefined,
    urlSocketServer;
  function beginsWith(s, possibleBeginning, flUnicase) {
    if (s === undefined) {
      //7/15/15 by DW
      return false;
    }
    if (s.length == 0) {
      //1/1/14 by DW
      return false;
    }
    if (flUnicase === undefined) {
      flUnicase = true;
    }
    if (flUnicase) {
      for (let i = 0; i < possibleBeginning.length; i++) {
        if (stringLower(s[i]) != stringLower(possibleBeginning[i])) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < possibleBeginning.length; i++) {
        if (s[i] != possibleBeginning[i]) {
          return false;
        }
      }
    }
    return true;
  }
  function readHttpFile(url, timeoutInMilliseconds, headers, callback) {
    if (timeoutInMilliseconds === undefined) {
      timeoutInMilliseconds = 5000;
    }
    if (headers === undefined) {
      headers = new Object();
    }
    let jxhr = $.ajax({
      url: url,
      dataType: 'text',
      headers: headers,
      timeout: timeoutInMilliseconds,
    })
      .success(function (data, status) {
        callback(undefined, data);
      })
      .error(function (status) {
        callback(status);
      });
  }
  function wsWatchForChange() {
    //connect with socket server, if not already connected
    if (mySocket === undefined) {
      mySocket = new WebSocket(urlSocketServer);
      mySocket.onopen = function (evt) {
        let msg = 'watch ' + urlOpmlFile;
        mySocket.send(msg);
        console.log('wsWatchForChange: socket is open. sent msg == ' + msg);
      };
      mySocket.onmessage = function (evt) {
        let s = evt.data;
        if (s !== undefined) {
          //no error
          const updatekey = 'update\r';
          if (beginsWith(s, updatekey)) {
            //it's an update
            let opmltext = stringDelete(s, 1, updatekey.length);
            console.log(
              'wsWatchForChange: update received along with ' +
                opmltext.length +
                ' chars of OPML text.',
            );
            callback(undefined, opmlParse(opmltext));
          }
        }
      };
      mySocket.onclose = function (evt) {
        mySocket = undefined;
      };
      mySocket.onerror = function (evt) {
        console.log(
          'wsWatchForChange: socket for outline ' +
            urlOpmlFile +
            ' received an error.',
        );
      };
    }
  }

  if (options === undefined) {
    //9/27/21 by DW
    options = {
      flSubscribe: false,
    };
  }

  readHttpFile(urlOpmlFile, undefined, undefined, function (err, opmltext) {
    if (err) {
      callback(err);
    } else if (options.flSubscribe) {
      const theOutline = opmlParse(opmltext);
      urlSocketServer = theOutline.opml.head.urlUpdateSocket;
      wsWatchForChange(); //connect with socket server
      self.setInterval(wsWatchForChange, 1000); //make sure we stay connected
      callback(undefined, theOutline);
    } else {
      callback(undefined, opmlParse(opmltext));
    }
  });
}

export const opml = {
  parse: opmlParse,
  stringify: opmlStringify,
  htmlify: getOutlineHtml,
  read: readOutline, // 9/24/21 by DW
  visitAll,
  markdownToOutline, // 1/3/22 by DW
  outlineToMarkdown, // 1/3/22 by DW
};
